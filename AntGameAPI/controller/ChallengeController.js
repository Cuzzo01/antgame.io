const { RejectIfAnon } = require("../auth/AuthHelpers");
const ChallengeDao = require("../dao/ChallengeDao");
const UserDao = require("../dao/UserDao");
const { VerifyArtifact } = require("../helpers/ChallengeRunHelper");
const {
  getGeneralizedTimeStringFromObjectID,
  getTimeStringForDailyChallenge,
} = require("../helpers/TimeHelper");
const FlagHandler = require("../handler/FlagHandler");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");
const DailyChallengeHandler = require("../handler/DailyChallengeHandler");
const LeaderboardHandler = require("../handler/LeaderboardHandler");
const ActiveChallengesHandler = require("../handler/ActiveChallengesHandler");
const MapHandler = require("../handler/MapHandler");
const { SeedBroker } = require("../bll/SeedBroker");
const { GetIpAddress } = require("../helpers/IpHelper");
const Logger = require("../Logger");

async function postRun(req, res) {
  try {
    const user = req.user;
    const runData = req.body.data;

    let runTags = [];

    let saveRun = false;

    const RejectUnverifiedRuns = await FlagHandler.getFlagValue("reject-anticheat-fail-runs");

    const challengeConfig = await ChallengeDao.getChallengeByChallengeId(runData.challengeID);
    if (challengeConfig.active === false && req.user.admin !== true) {
      Logger.logError(
        "ChallengeController.PostRun",
        `Run submitted on inactive challenge: ${challengeConfig.name}, ${user.username}`
      );
      res.sendStatus(409);
      return;
    }

    if (runData.Score === null || runData.ClientID === null) {
      res.sendStatus(400);
    }

    let verificationResult;
    try {
      let mapPath;
      if (challengeConfig.mapID)
        mapPath = (await MapHandler.getMapData({ mapID: challengeConfig.mapID })).url;

      verificationResult = VerifyArtifact({
        runData,
        clientID: user.clientID,
        challengeConfig,
        mapPath,
      });
    } catch (e) {
      Logger.logError("ChallengeController.PostRun", e);
      res.sendStatus(400);
      return;
    }
    if (verificationResult !== "verified") {
      if (RejectUnverifiedRuns === false) verificationResult += " *IGNORED*";
      runTags.push({ type: "failed verification", metadata: { reason: verificationResult } });
      saveRun = "Verify Failed";
    }

    if (!user.anon) {
      const { isValid, message } = await SeedBroker.checkSeed({
        seed: runData.GameConfig.seed,
        userID: user.id,
        homeLocations: runData.HomeLocations,
      });
      if (!isValid) {
        verificationResult = false;
        runTags.push({
          type: "failed verification",
          metadata: { reason: "Invalid seed", message },
        });
        saveRun = "Verify Failed";
      }
    }

    let currentDetails;
    let isPB = false;
    if (!user.anon) {
      if (verificationResult === "verified" || RejectUnverifiedRuns === false) {
        currentDetails = await UserDao.getChallengeDetailsByUser(user.id, runData.challengeID);
        if (currentDetails === null) {
          isPB = true;
          saveRun = "New challenge";
        } else if (currentDetails.pb < runData.Score) {
          isPB = true;
          saveRun = "New PB";
        }

        if (isPB)
          runTags.push({
            type: "pr",
            metadata: { runNumber: (currentDetails ? currentDetails.runs : 0) + 1 },
          });
      }
    }

    if (saveRun === false) {
      // Where save limiting logic will live in the future
      // Only set to true % of time you want random run saved
      saveRun = true;
    }

    let runID;
    if (saveRun) {
      let runRecord = {
        score: runData.Score,
        submissionTime: new Date(),
        name: runData.Name,
        challengeID: runData.challengeID,
        clientID: runData.ClientID,
        env: runData.Env,
        details: {
          homeLocations: runData.HomeLocations,
          timing: runData.Timing,
          foodConsumed: runData.FoodConsumed,
          seed: runData.GameConfig.seed,
        },
        tags: runTags,
      };

      let snapshots = [];
      try {
        const startSnapshot = runData.Snapshots.start;
        const startHomeCounts = JSON.parse(startSnapshot[5]);
        const finishSnapshot = runData.Snapshots.finish;
        const finishHomeCounts = JSON.parse(finishSnapshot[5]);
        snapshots[0] = [...startSnapshot.slice(0, 5), startHomeCounts, ...startSnapshot.slice(6)];
        snapshots[1] = [
          ...finishSnapshot.slice(0, 5),
          finishHomeCounts,
          ...finishSnapshot.slice(6),
        ];
      } catch (e) {
        Logger.logError("ChallengeController.PostRun", e);
        runRecord.tags.push({ type: "Unparsable snapshots" });
      }
      runRecord.details.snapshots = snapshots ? snapshots : runData.Snapshots;

      if (user.id) {
        runRecord.userID = user.id;
      } else {
        runRecord.userID = false;
        runRecord.IP = GetIpAddress(req);
      }
      runID = await ChallengeDao.submitRun(runRecord);

      if (RejectUnverifiedRuns && verificationResult !== "verified") {
        res.sendStatus(418);
        return;
      }

      if (!user.anon) {
        if (isPB && currentDetails === null) {
          await UserDao.addNewChallengeDetails(user.id, runData.challengeID, runData.Score, runID);
        } else if (isPB && currentDetails.pb) {
          await UserDao.updateChallengePBAndRunCount(
            user.id,
            runData.challengeID,
            runData.Score,
            runID
          );
        } else {
          await UserDao.incrementChallengeRunCount(user.id, runData.challengeID);
        }

        if (isPB) {
          LeaderboardHandler.unsetItem(runData.challengeID);
          await ChallengeDao.markRunForVerification({
            runID,
            priority: challengeConfig.dailyChallenge ? 1 : 5,
          });
        }

        let response = {};
        if (await FlagHandler.getFlagValue("show-player-count-in-challenge")) {
          const playerCount = await LeaderboardHandler.getChallengePlayerCount(runData.challengeID);
          response.playerCount = playerCount;
        }

        let isWorldRecord = false;
        let challengeRecord = await ChallengeDao.getRecordByChallenge(runData.challengeID);
        if (isPB) {
          const recordEmpty = challengeRecord && Object.keys(challengeRecord).length === 0;
          if (recordEmpty || challengeRecord.score < runData.Score) {
            const shouldShowUserOnLeaderboard = await UserDao.shouldShowUserOnLeaderboard(user.id);
            if (shouldShowUserOnLeaderboard) {
              isWorldRecord = true;
              ChallengeDao.updateChallengeRecord(
                runData.challengeID,
                runData.Score,
                user.username,
                user.id,
                runID
              );

              ChallengeDao.addTagToRun(runID, { type: "wr" });
              ActiveChallengesHandler.unsetItem();
            }
          }
        }

        response.rank = await LeaderboardHandler.getChallengeRankByUserId(
          runData.challengeID,
          user.id
        );
        response.pr = (
          await LeaderboardHandler.getLeaderboardEntryByUserID(runData.challengeID, user.id)
        ).pb;

        if (isWorldRecord) {
          response.wr = {
            score: runData.Score,
            name: user.username,
            id: user.id,
          };
          response.isWrRun = true;
        } else if (challengeRecord) {
          response.wr = {
            score: challengeRecord.score,
            name: challengeRecord.username,
            id: challengeRecord.id,
          };
        }

        res.send(response);
        return;
      }
    }
    res.send("Ok");
  } catch (e) {
    Logger.logError("ChallengeController.PostRun", e);
    res.status(500);
    res.send("Save failed");
  }
}

async function getChallenge(req, res) {
  try {
    let id = req.params.id;
    if (id.toLowerCase() === "daily") {
      id = await DailyChallengeHandler.getActiveDailyChallenge();
    }

    const config = await ChallengeDao.getChallengeByChallengeId(id);
    if (config === false) {
      res.status(400);
      res.send("Invalid challenge ID");
      return;
    }

    if (!config.active && !req.user.admin) {
      res.status(400);
      res.send("Challenge not active");
      return;
    }

    const toReturn = {
      id: config.id,
      seconds: config.seconds,
      homeLimit: config.homeLimit,
      name: config.name,
      active: config.active,
    };

    if (config.mapID) {
      const mapData = await MapHandler.getMapData({ mapID: config.mapID.toString() });
      if (await FlagHandler.getFlagValue("use-spaces-proxy")) {
        toReturn.mapPath = `https://antgame.io/assets/${mapData.url}`;
      } else {
        toReturn.mapPath = `https://antgame.nyc3.digitaloceanspaces.com/${mapData.url}`;
      }
    } else {
      toReturn.mapPath = config.mapPath;
    }

    res.send(toReturn);
  } catch (e) {
    Logger.logError("ChallengeController.GetChallenge", e);
    res.status(500);
    res.send("Get challenge failed");
  }
}

async function getActiveChallenges(req, res) {
  try {
    const user = req.user;

    const activeChallengeData = await ActiveChallengesHandler.getActiveChallenges();
    const activeChallenges = activeChallengeData.challenges;
    const worldRecords = activeChallengeData.worldRecords;

    let challengeIDList = [];
    activeChallenges.forEach(challenge => {
      challengeIDList.push(challenge.id);
    });

    const records = {};
    for (const [id, wr] of Object.entries(worldRecords)) {
      records[id] = { wr: wr };
    }

    let userRecords = false;
    if (!user.anon) {
      userRecords = await UserDao.getUserPBs(user.id);
      const activeUserRecords = userRecords.filter(
        record => challengeIDList.findIndex(id => id.equals(record.ID)) > -1
      );

      if (activeUserRecords) {
        const shouldGetRanks = await FlagHandler.getFlagValue("show-rank-on-challenge-list");

        let rankPromises = [];
        activeUserRecords.forEach(userRecord => {
          const challengeID = userRecord.ID;
          records[challengeID].pb = userRecord.pb;
          records[challengeID].runs = userRecord.runs;

          if (shouldGetRanks) {
            rankPromises.push(
              LeaderboardHandler.getChallengeRankByUserId(challengeID, user.id).then(rank => {
                return {
                  id: challengeID,
                  rank: rank,
                };
              })
            );
          }
        });

        await Promise.all(rankPromises).then(rankResults => {
          rankResults.forEach(rank => {
            records[rank.id].rank = rank.rank;
          });
        });
      }
    }

    res.send({ challenges: activeChallenges, records: records });
  } catch (e) {
    Logger.logError("ChallengeController.GetActiveChallenges", e);
    res.status(500);
    res.send("Get challenge failed");
  }
}

async function getRecords(req, res) {
  try {
    const challengeID = req.params.id;
    const user = req.user;

    let response = {};
    const worldRecord = await ChallengeDao.getRecordByChallenge(challengeID);
    if (Object.keys(worldRecord).length !== 0)
      response.wr = {
        score: worldRecord.score,
        name: worldRecord.username,
        id: worldRecord.id,
      };

    if (!user.anon) {
      const challengeDetails = await UserDao.getChallengeDetailsByUser(user.id, challengeID);
      if (challengeDetails !== null) {
        const rank = await LeaderboardHandler.getChallengeRankByUserId(challengeID, user.id);
        response.pr = challengeDetails.pb;
        response.rank = rank;
      }
    }

    if (await FlagHandler.getFlagValue("show-player-count-in-challenge")) {
      const playerCount = await LeaderboardHandler.getChallengePlayerCount(challengeID);
      response.playerCount = playerCount;
    }

    res.send(response);
  } catch (e) {
    Logger.logError("ChallengeController.GetRecords", e);
    res.status(500);
    res.send("Get run details failed");
  }
}

async function getLeaderboard(req, res) {
  try {
    const user = req.user;
    let challengeID = req.params.id;

    const currentDaily = await DailyChallengeHandler.getActiveDailyChallenge();
    let getCurrentDaily = challengeID.toLowerCase() === "daily";
    if (getCurrentDaily) challengeID = currentDaily;

    const leaderBoardEntries = await LeaderboardHandler.getChallengeLeaderboard(challengeID);

    if (leaderBoardEntries.length === 0) {
      res.status(404);
      res.send("Found no records for that challengeID");
      return;
    }

    const details = await ChallengeDao.getChallengeByChallengeId(challengeID);
    const isDaily = details.dailyChallenge === true;

    let leaderboardData = [];
    let onLeaderboard = false;
    let isCurrentDaily = getCurrentDaily || currentDaily.equals(challengeID);
    for (let i = 0; i < leaderBoardEntries.length; i++) {
      const entry = leaderBoardEntries[i];
      const timeString =
        isDaily && !isCurrentDaily
          ? getTimeStringForDailyChallenge(entry.runID)
          : getGeneralizedTimeStringFromObjectID(entry.runID) + " ago";

      if (entry._id == user.id) {
        onLeaderboard = true;
      }

      leaderboardData.push({
        id: entry._id,
        rank: i + 1,
        username: entry.username,
        pb: entry.pb,
        age: timeString,
      });
    }

    if (!onLeaderboard) {
      const pr = await UserDao.getChallengeDetailsByUser(user.id, challengeID);
      if (pr) {
        const currentUserRank = await LeaderboardHandler.getChallengeRankByUserId(
          challengeID,
          user.id
        );

        if (currentUserRank > leaderboardData.length + 1) {
          const entryAbove = await LeaderboardHandler.getLeaderboardEntryByRank(
            challengeID,
            currentUserRank - 1
          );
          const timeString =
            isDaily && !isCurrentDaily
              ? getTimeStringForDailyChallenge(entryAbove.runID)
              : getGeneralizedTimeStringFromObjectID(entryAbove.runID) + " ago";
          leaderboardData.push({
            id: entryAbove._id,
            rank: currentUserRank - 1,
            username: entryAbove.username,
            pb: entryAbove.pb,
            age: timeString,
          });
        }

        const timeString =
          isDaily && !isCurrentDaily
            ? getTimeStringForDailyChallenge(pr.pbRunID)
            : getGeneralizedTimeStringFromObjectID(pr.pbRunID) + " ago";

        leaderboardData.push({
          id: user.id,
          rank: currentUserRank,
          username: user.username,
          pb: pr.pb,
          age: timeString,
        });
      }
    }

    let solutionImgPath;
    if (details.solutionImage) {
      if (await FlagHandler.getFlagValue("use-spaces-proxy")) {
        solutionImgPath = "https://antgame.io/assets/" + details.solutionImage;
      } else {
        solutionImgPath = "https://antgame.nyc3.digitaloceanspaces.com/" + details.solutionImage;
      }
    }

    const response = {
      name: await ObjectIDToNameHandler.getChallengeName(challengeID),
      leaderboard: leaderboardData,
      daily: isDaily,
      solutionImage: solutionImgPath,
    };

    if (await FlagHandler.getFlagValue("show-player-count-on-leaderboard"))
      response.playerCount = await LeaderboardHandler.getChallengePlayerCount(challengeID);

    res.send(response);
  } catch (e) {
    Logger.logError("ChallengeController.GetLeaderboard", e);
    res.status(500);
    res.send("Get leader board failed");
  }
}

async function getPRHomeLocations(req, res) {
  try {
    if (RejectIfAnon(req, res)) return;

    const user = req.user;
    const challengeID = req.params.id;

    const prRun = await LeaderboardHandler.getLeaderboardEntryByUserID(challengeID, user.id);
    const result = await ChallengeDao.getRunDataByRunId(prRun.runID);

    if (!result) {
      res.status(404);
      res.send("No PR found");
      return;
    }
    res.send({ locations: result.homeLocations, amounts: result.homeAmounts });
  } catch (e) {
    Logger.logError("ChallengeController.GetPRHomeLocations", e);
    res.status(500);
    res.send("Get leader board failed");
  }
}

module.exports = {
  postRun,
  getChallenge,
  getActiveChallenges,
  getRecords,
  getLeaderboard,
  getPRHomeLocations,
};
