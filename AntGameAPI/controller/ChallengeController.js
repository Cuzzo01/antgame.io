const { RejectIfAnon } = require("../auth/AuthHelpers");
const ChallengeDao = require("../dao/ChallengeDao");
const UserDao = require("../dao/UserDao");

async function postRun(req, res) {
  try {
    const user = req.user;
    const runData = req.body.data;

    let saveRun = false;
    let currentDetails;
    if (runData.PB) {
      currentDetails = await UserDao.getChallengeDetailsByUser(user.id, runData.challengeID);
      if (currentDetails === null) saveRun = "New challenge";
      else if (currentDetails.pb < runData.Score) saveRun = "New PB";
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
          gameConfig: runData.GameConfig,
          timing: runData.Timing,
          snapshots: runData.Snapshots,
          foodConsumed: runData.FoodConsumed,
        },
      };
      if (user.id) {
        runRecord.userID = user.id;
      } else {
        runRecord.userID = false;
      }
      runID = await ChallengeDao.submitRun(runRecord);
    }

    if (!user.anon) {
      if (saveRun === "New PB") {
        UserDao.updateChallengePBAndRunCount(user.id, runData.challengeID, runData.Score, runID);
      } else if (saveRun === "New challenge") {
        UserDao.addNewChallengeDetails(user.id, runData.challengeID, runData.Score, runID);
      } else {
        UserDao.incrementChallengeRunCount(user.id, runData.challengeID);
      }

      let response = {};
      if (runData.PB) {
        const newRank = await UserDao.getLeaderboardRankByScore(runData.challengeID, runData.Score);
        response.rank = newRank;
      }

      let isWorldRecord = false;
      let challengeRecord;
      if (saveRun && user.showOnLeaderboard !== false) {
        challengeRecord = await ChallengeDao.getRecordByChallenge(runData.challengeID);
        const recordEmpty = challengeRecord && Object.keys(challengeRecord).length === 0;
        if (recordEmpty || challengeRecord.score < runData.Score) {
          isWorldRecord = true;
          ChallengeDao.updateChallengeRecord(runData.challengeID, runData.Score, user.username, user.id, runID);
        }
      }
      if (isWorldRecord)
        response.wr = {
          score: runData.Score,
          name: user.username,
        };
      else if (challengeRecord)
        response.wr = {
          score: challengeRecord.score,
          name: challengeRecord.username,
        };
      res.send(response);
      return;
    }

    res.send("Ok");
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Save failed");
  }
}

async function getChallenge(req, res) {
  try {
    const id = req.params.id;
    const config = await ChallengeDao.getChallengeByChallengeId(id);
    if (config === false) {
      res.status(400);
      res.send("Invalid challenge ID");
      return;
    }
    res.send(config);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get challenge failed");
  }
}

async function getActiveChallenges(req, res) {
  try {
    const user = req.user;

    const activeChallenges = await ChallengeDao.getActiveChallenges();

    let challengeIDList = [];
    activeChallenges.forEach(challenge => {
      challengeIDList.push(challenge.id);
    });

    let records = await ChallengeDao.getRecordsByChallengeList(challengeIDList);
    let userRecords = false;
    if (!user.anon) {
      userRecords = await UserDao.getUserPBsByChallengeList(user.id, challengeIDList);
      if (userRecords)
        userRecords.forEach(userRecord => {
          if (records.hasOwnProperty(userRecord.ID)) records[userRecord.ID].pb = userRecord.pb;
        });
    }

    res.send({ challenges: activeChallenges, records: records });
  } catch (e) {
    console.log(e);
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
      };

    if (!user.anon) {
      const challengeDetails = await UserDao.getChallengeDetailsByUser(user.id, challengeID);
      if (challengeDetails !== null) {
        const rank = await UserDao.getLeaderboardRankByScore(challengeID, challengeDetails.pb);

        (response.pr = challengeDetails.pb), (response.rank = rank);
      }
    }

    res.send(response);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get run details failed");
  }
}

async function getLeaderboard(req, res) {
  try {
    const challengeID = req.params.id;
    const leaderBoardEntries = await UserDao.getLeaderboardByChallengeId(challengeID);
    const challenge = await ChallengeDao.getChallengeByChallengeId(challengeID);

    if (leaderBoardEntries.length === 0) {
      res.status(404);
      res.send("Found no records for that challengeID");
      return;
    }

    const response = {
      name: challenge.name,
      leaderboard: leaderBoardEntries,
    };
    res.send(response);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get leader board failed");
  }
}

async function getPRHomeLocations(req, res) {
  try {
    if (RejectIfAnon(req, res)) return;

    const user = req.user;
    const challengeID = req.params.id;

    // FIXME: Make a mongo aggregate function to do this lookup in just one call
    const runID = await UserDao.getPRRunIDByChallengeID(user.id, challengeID);
    const homePositions = await ChallengeDao.getRunHomePositionsByRunId(runID);

    if (!homePositions) {
      res.status(404);
      res.send("No PR found");
      return;
    }
    res.send({ home: homePositions });
  } catch (e) {
    console.log(e);
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
