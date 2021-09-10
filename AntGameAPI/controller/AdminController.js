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
} = require("../dao/AdminDao");
const { getActiveChallenges } = require("../dao/ChallengeDao");
const { getLeaderboardRankByScore } = require("../dao/UserDao");
const UserIdToUsernameHandler = require("../handler/UserIdToUsernameHandler");
const ChallengePlayerCountHandler = require("../handler/ChallengePlayerCountHandler");

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
    values.forEach(result => {
      const label = getLabelFromResult(result);
      response.uniqueUserStats[label] = result.users;
    });
  });

  await Promise.all(newAccountStatPromises).then(values => {
    values.forEach(result => {
      const label = getLabelFromResult(result);
      response.newAccountStats[label] = result.newAccounts;
    });
  });

  await Promise.all(runCountStatPromises).then(values => {
    values.forEach(result => {
      const label = getLabelFromResult(result);
      response.runCountStats[label] = result.runCount;
    });
  });

  res.send(response);
  return;
}

async function getConfigList(req, res) {
  try {
    res.send(await getConfigListFromDB());
    return;
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
}

async function getConfigDetails(req, res) {
  try {
    const id = req.params.id;
    let result = await getConfigDetailsByID(id);

    result["playerCount"] = await ChallengePlayerCountHandler.getPlayerCount(id);

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
    console.log(e);
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
    console.log(e);
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

    await updateConfigByID(id, patchRequest);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
}

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
    console.error(e);
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
            getLeaderboardRankByScore(challenge.id, userDetails.pb).then(rank => {
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
    console.log(e);
    res.sendStatus(500);
  }
}

async function patchUser(req, res) {
  try {
    const request = req.body;

    const id = req.params.id;

    const newBanned = request.banned;

    let patchRequest = {};
    if (newBanned !== undefined) {
      if (typeof newBanned !== "boolean") {
        res.sendStatus(400);
        return;
      } else {
        patchRequest.banned = newBanned;
      }
    }

    const newDetails = await updateUserByID(id, patchRequest);
    res.send(newDetails);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
}

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
          results[i].username = await UserIdToUsernameHandler.getUsername(result.userID);
      }

      res.send(results);
    } else {
      send400(res, "Unknown by value");
      return;
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
}

const send400 = (res, message) => {
  res.status(400);
  res.send(message);
};

const getLabelFromResult = result => {
  let label = "";
  if (result.hours === 12) label = "12Hs";
  else if (result.hours === 24) label = "24Hs";
  else if (result.hours === 72) label = "3Ds";
  else if (result.hours === 168) label = "7Ds";
  else if (result.hours === 720) label = "30Ds";
  return label;
};

module.exports = {
  getStats,
  getConfigList,
  getConfigDetails,
  postConfig,
  patchConfig,
  getUsers,
  getUserDetails,
  patchUser,
  getRuns,
};
