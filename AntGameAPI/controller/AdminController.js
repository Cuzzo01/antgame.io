const {
  getUserLoginCount,
  getConfigListFromDB,
  getConfigDetailsByID,
  updateConfigByID,
  addNewConfig,
  getRecentRuns,
  getUserDetailsByID,
  getNewAccountCount,
  updateUserByID,
  getRecentlyCreatedUsers,
  getRecentlyLoggedInUsers,
  getRunCount,
  getRunDetailsByID,
  getFlagListFromDB,
  getFlagDetailsByID,
  updateFlagByID,
  getChampionshipListFromDB,
  saveNewServiceToken,
} = require("../dao/AdminDao");
const { getActiveChallenges, markRunForVerification } = require("../dao/ChallengeDao");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");
const LeaderboardHandler = require("../handler/LeaderboardHandler");
const UserHandler = require("../handler/UserHandler");
const FlagHandler = require("../handler/FlagHandler");
const TokenRevokedHandler = require("../handler/TokenRevokedHandler");
const { addStatToResponse } = require("../helpers/AuthStatHelpers");
const Logger = require("../Logger");
const { getChampionshipDetailsFromDB } = require("../dao/ChampionshipDao");
const { handleDailyChallengeChange } = require("../bll/DailyChallengeCron");
const { GenerateSolutionImage } = require("../bll/RecordImageGenerator");
const crypto = require("crypto");
const { generatePasswordHash } = require("../auth/PasswordHandler");

//#region stats
async function getStats(req, res) {
  let response = {
    uniqueUserStats: {},
    newAccountStats: {},
    runCountStats: {},
  };

  let loginStatPromises = [];
  loginStatPromises.push(getUserLoginCount(24));
  loginStatPromises.push(getUserLoginCount(168));
  loginStatPromises.push(getUserLoginCount(720));

  let newAccountStatPromises = [];
  newAccountStatPromises.push(getNewAccountCount(24));
  newAccountStatPromises.push(getNewAccountCount(168));
  newAccountStatPromises.push(getNewAccountCount(720));

  let runCountStatPromises = [];
  runCountStatPromises.push(getRunCount(24));
  runCountStatPromises.push(getRunCount(72));
  runCountStatPromises.push(getRunCount(168));

  await Promise.all(loginStatPromises).then(values => {
    addStatToResponse(response, "uniqueUserStats", values);
  });

  await Promise.all(newAccountStatPromises).then(values => {
    addStatToResponse(response, "newAccountStats", values);
  });

  await Promise.all(runCountStatPromises).then(values => {
    addStatToResponse(response, "runCountStats", values);
  });

  res.send(response);
  return;
}
//#endregion stats

//#region configs
async function getConfigList(req, res) {
  try {
    const configs = await getConfigListFromDB();

    let playerCountPromises = [];
    for (const [index, config] of Object.entries(configs)) {
      if (config.record) {
        config.record["time"] = config.record.runID.getTimestamp();
      }
      if (config.active) {
        playerCountPromises.push(
          LeaderboardHandler.getChallengePlayerCount(config._id).then(count => {
            return { index: index, count: count };
          })
        );
      }
    }

    await Promise.all(playerCountPromises).then(results => {
      results.forEach(result => {
        configs[result.index]["playerCount"] = result.count;
      });
    });

    res.send(configs);
    return;
  } catch (e) {
    Logger.logError("AdminController.getConfigList", e);
    res.sendStatus(500);
    return;
  }
}

async function getConfigDetails(req, res) {
  try {
    const id = req.params.id;
    let result = await getConfigDetailsByID(id);

    result["playerCount"] = await LeaderboardHandler.getChallengePlayerCount(id);

    if (result.records) {
      let modifiedRecords = result.records;
      for (let i = 0; i < modifiedRecords.length; i++) {
        const record = modifiedRecords[i];
        const timestamp = record.runID.getTimestamp();
        modifiedRecords[i].time = timestamp;
      }
      result.records = modifiedRecords;
    }
    res.send(result);
  } catch (e) {
    Logger.logError("AdminController.getConfigDetails", e);
    res.sendStatus(500);
    return;
  }
}

async function postConfig(req, res) {
  try {
    const newConfigRequest = req.body;

    const mapPath = newConfigRequest.mapPath;
    const name = newConfigRequest.name;
    const time = parseInt(newConfigRequest.time);
    const homeLimit = parseInt(newConfigRequest.homeLimit);

    if (!mapPath || !time || !name || !homeLimit) {
      res.sendStatus(400);
      return;
    }

    const newConfig = {
      name: name,
      mapPath: mapPath,
      seconds: time,
      homeLimit: homeLimit,
      active: false,
    };

    const result = await addNewConfig(newConfig);
    res.send(result._id);
  } catch (e) {
    Logger.logError("AdminController.postConfig", e);
    res.sendStatus(500);
    return;
  }
}

async function patchConfig(req, res) {
  try {
    const request = req.body;

    const id = req.params.id;

    const newOrder = request.order;
    const newActive = request.active;
    const newThumbnailURL = request.thumbnailURL;

    const patchRequest = {};
    if (newOrder !== undefined) {
      if (typeof newOrder !== "number") {
        res.sendStatus(400);
        return;
      } else {
        patchRequest.order = newOrder;
      }
    }

    if (newActive !== undefined) {
      if (typeof newActive !== "boolean") {
        res.sendStatus(400);
        return;
      } else {
        patchRequest.active = newActive;
      }
    }

    if (newThumbnailURL !== undefined) {
      if (typeof newThumbnailURL !== "string") {
        res.sendStatus(400);
        return;
      } else {
        patchRequest.thumbnailURL = newThumbnailURL;
      }
    }

    await updateConfigByID(id, patchRequest);
    res.sendStatus(200);
  } catch (e) {
    Logger.logError("AdminController.patchConfig", e);
    res.sendStatus(500);
    return;
  }
}
//#endregion configs

//#region daily stuff
async function dailyChallengeSwap(req, res) {
  try {
    await handleDailyChallengeChange();
    res.sendStatus(200);
  } catch (e) {
    Logger.logError("AdminController.generateDailyChallenge", e);
    res.sendStatus(500);
    return;
  }
}

async function generateAndBindSolutionImage(req, res) {
  try {
    const challengeID = req.body.challengeID;
    const solutionImagePath = await GenerateSolutionImage({ challengeID });
    await updateConfigByID(challengeID, { solutionImage: solutionImagePath });

    res.sendStatus(200);
    return;
  } catch (e) {
    Logger.logError("AdminController.generateAndBindSolutionImage", e);
    res.sendStatus(500);
    return;
  }
}
//#endregion

//#region users
async function getUsers(req, res) {
  try {
    const query = req.query;
    if (query.by === "recentlyCreated") {
      const count = query.count;
      if (!count) {
        send400(res, "Must specify count");
        return;
      } else if (count > 25) {
        send400(res, "Count too high");
        return;
      }
      const results = await getRecentlyCreatedUsers(parseInt(count));
      res.send(results);
    } else if (query.by === "recentlyLoggedIn") {
      const count = query.count;
      if (!count) {
        send400(res, "Must specify count");
        return;
      } else if (count > 25) {
        send400(res, "Count too high");
        return;
      }
      const results = await getRecentlyLoggedInUsers(parseInt(count));
      res.send(results);
    } else {
      send400(res, "Unknown by value");
      return;
    }
  } catch (e) {
    Logger.logError("AdminController.getUsers", e);
    res.sendStatus(500);
    return;
  }
}

async function getUserDetails(req, res) {
  try {
    const id = req.params.id;
    let result = await getUserDetailsByID(id);
    const activeChallenges = await getActiveChallenges(id);

    let rankPromises = [];
    result.activeChallengeDetails = {};
    const userChallengeDetails = result.challengeDetails;
    if (userChallengeDetails) {
      activeChallenges.forEach(challenge => {
        const userDetails = userChallengeDetails.find(details => details.ID.equals(challenge.id));
        if (userDetails) {
          rankPromises.push(
            LeaderboardHandler.getChallengeRankByUserId(challenge.id, id).then(rank => {
              return { id: challenge.id, rank: rank };
            })
          );
          result.activeChallengeDetails[challenge.id] = {
            score: userDetails.pb,
            runID: userDetails.pbRunID,
            name: challenge.name,
            runs: userDetails.runs,
            runTime: userDetails.pbRunID.getTimestamp(),
          };
        }
      });

      await Promise.all(rankPromises).then(ranks => {
        ranks.forEach(rank => (result.activeChallengeDetails[rank.id].rank = rank.rank));
      });
    }
    delete result.challengeDetails;

    res.send(result);
  } catch (e) {
    Logger.logError("AdminController.getUserDetails", e);
    res.sendStatus(500);
  }
}

async function patchUser(req, res) {
  try {
    const request = req.body;

    const id = req.params.id;

    const newBanned = request.banned;
    const newShowOnLeaderboard = request.showOnLeaderboard;
    const newBanMessage = request.banMessage;

    let patchRequest = {};
    if (newBanned !== undefined) {
      if (typeof newBanned !== "boolean") {
        res.sendStatus(400);
        return;
      } else {
        patchRequest.banned = newBanned;
        if (!newBanned) patchRequest.banInfo = {};
      }
    }

    if (newShowOnLeaderboard !== undefined) {
      if (typeof newShowOnLeaderboard !== "boolean") {
        res.sendStatus(400);
        return;
      } else {
        patchRequest.showOnLeaderboard = newShowOnLeaderboard;
      }
    }

    if (newBanMessage !== undefined) {
      if (typeof newBanMessage !== "string") {
        res.sendStatus(400);
        return;
      } else {
        patchRequest.banInfo = { message: newBanMessage };
      }
    }

    const newDetails = await updateUserByID(id, patchRequest);
    res.send(newDetails);
  } catch (e) {
    Logger.logError("AdminController.patchUser", e);
    res.sendStatus(500);
    return;
  }
}
//#endregion users

//#region runs
async function getRuns(req, res) {
  try {
    const query = req.query;
    if (query.by === "recent") {
      const count = query.count;
      if (!count) {
        send400(res, "Must specify count");
        return;
      } else if (count > 50) {
        send400(res, "Count too high");
        return;
      }
      const results = await getRecentRuns(parseInt(count));

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.userID)
          results[i].username = await ObjectIDToNameHandler.getUsername(result.userID);
      }

      res.send(results);
    } else {
      send400(res, "Unknown by value");
      return;
    }
  } catch (e) {
    Logger.logError("AdminController.getRuns", e);
    res.sendStatus(500);
    return;
  }
}

async function getRunDetails(req, res) {
  try {
    const id = req.params.id;

    const details = await getRunDetailsByID(id);
    if (details.userID) details.username = await ObjectIDToNameHandler.getUsername(details.userID);

    res.send(details);
  } catch (e) {
    Logger.logError("AdminController.getRunDetails", e);
    res.sendStatus(500);
  }
}

async function addRunVerificationTag(req, res) {
  try {
    const runID = req.body.runID;

    await markRunForVerification({ runID });
    res.sendStatus(200);
  } catch (e) {
    Logger.logError("AdminController.markRunForVerification", e);
    res.sendStatus(500);
  }
}
//#endregion runs

//#region championships
async function getChampionshipList(req, res) {
  try {
    const list = await getChampionshipListFromDB();
    res.send(list);
  } catch (e) {
    Logger.logError("AdminController.getChampionshipList", e);
    res.sendStatus(500);
    return;
  }
}

async function getChampionshipDetails(req, res) {
  try {
    const id = req.params.id;
    const details = await getChampionshipDetailsFromDB(id);

    if (details.userPoints) {
      for (let i = 0; i < details.userPoints.length; i++) {
        const entry = details.userPoints[i];
        details.userPoints[i]["username"] = await ObjectIDToNameHandler.getUsername(entry.userID);
      }
    }

    for (let i = 0; i < details.configs.length; i++) {
      const configID = details.configs[i];
      const configName = await ObjectIDToNameHandler.getChallengeName(configID);
      details.configs[i] = {
        id: configID,
        name: configName,
      };
    }

    res.send(details);
  } catch (e) {
    Logger.logError("AdminController.getChampionshipDetails", e);
    res.sendStatus(500);
  }
}
//#endregion championship

//#region Flags
async function getFlagList(req, res) {
  try {
    const list = await getFlagListFromDB();
    res.send(list);
  } catch (e) {
    Logger.logError("AdminController.getFlagList", e);
    res.sendStatus(500);
  }
}

async function getFlagDetails(req, res) {
  try {
    const id = req.params.id;
    const details = await getFlagDetailsByID(id);
    res.send(details);
  } catch (e) {
    Logger.logError("AdminController.getFlagDetails", e);
    res.sendStatus(500);
  }
}

async function patchFlagDetails(req, res) {
  try {
    const id = req.params.id;
    const request = req.body;

    const flagDetails = await getFlagDetailsByID(id);

    let patchRequest = {};
    switch (flagDetails.type) {
      case "bool":
        if (typeof request.value === "boolean") {
          patchRequest.value = request.value;
        } else {
          send400(res, "Value doesn't match flag type");
          return;
        }
        break;
      case "int":
        if (typeof request.value === "number") {
          patchRequest.value = request.value;
        } else {
          send400(res, "Value doesn't match flag type");
          return;
        }
        break;
      default:
        send400(res, "Flag type not supported");
        return;
    }

    const result = await updateFlagByID(id, patchRequest);
    res.send(result);
  } catch (e) {
    Logger.logError("AdminController.patchFlagDetails", e);
    res.sendStatus(500);
  }
}
//#endregion Flags

//#region Cache
async function dumpLeaderboardCache(req, res) {
  try {
    LeaderboardHandler.unsetAll();
    res.sendStatus(200);
  } catch (e) {
    Logger.logError("AdminController.dumpLeaderboardCache", e);
    res.sendStatus(500);
  }
}

async function dumpUserCache(req, res) {
  try {
    UserHandler.unsetAll();
    res.sendStatus(200);
  } catch (e) {
    Logger.logError("AdminController.dumpLeaderboardCache", e);
    res.sendStatus(500);
  }
}

async function dumpFlagCache(req, res) {
  try {
    FlagHandler.unsetAll();
    res.sendStatus(200);
  } catch (e) {
    Logger.logError("AdminController.dumpLeaderboardCache", e);
    res.sendStatus(500);
  }
}
//#endregion Cache

//#region ServiceTokens
async function generateNewServiceToken(req, res) {
  try {
    const serviceID = req.body.name;

    if (!serviceID) {
      send400(res, "No name provided");
      return;
    }

    let newToken;
    try {
      const randomBytes = crypto.randomBytes(32);
      newToken = randomBytes.toString("hex");
    } catch (e) {
      Logger.logError("AdminController.generateNewServiceToken", e);
      req.sendStatus(503);
      return;
    }

    const tokenHash = await generatePasswordHash(newToken);
    await saveNewServiceToken({ tokenHash, name: serviceID, createdBy: req.user.username });

    res.send(newToken);
  } catch (e) {
    Logger.logError("AuthController.generateNewServiceToken", e);
    res.sendStatus(500);
  }
}
//#endregion ServiceTokens

//#region Auth Control
async function revokeAllTokens(req, res) {
  try {
    TokenRevokedHandler.RevokeTokens();

    res.send("OK");
  } catch (e) {
    Logger.logError("AuthController.RevokeAllTokens", e);
    res.sendStatus(500);
  }
}

const send400 = (res, message) => {
  res.status(400);
  res.send(message);
};

module.exports = {
  getStats,
  getConfigList,
  getConfigDetails,
  postConfig,
  patchConfig,
  dailyChallengeSwap,
  getUsers,
  getUserDetails,
  patchUser,
  getRuns,
  getRunDetails,
  addRunVerificationTag,
  getChampionshipList,
  getChampionshipDetails,
  getFlagList,
  getFlagDetails,
  patchFlagDetails,
  dumpLeaderboardCache,
  dumpUserCache,
  dumpFlagCache,
  generateAndBindSolutionImage,
  generateNewServiceToken,
  revokeAllTokens,
};
