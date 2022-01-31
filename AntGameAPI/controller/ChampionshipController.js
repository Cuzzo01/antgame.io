const { ChampionshipOrchestrator } = require("../bll/ChampionshipOrchestrator");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");
const LeaderboardHandler = require("../handler/LeaderboardHandler");
const { getUserPointsByUserID } = require("../dao/ChampionshipDao");
const Logger = require("../Logger");

async function awardPoints(req, res) {
  try {
    const championshipID = req.params.id;
    const challengeID = req.body.challengeID;

    if (!challengeID) {
      send400(res, "ChallengeID required");
    } else if (!championshipID) {
      send400(res, "ChampionshipID required");
    } else {
      try {
        await ChampionshipOrchestrator.awardPointsForChallenge({ championshipID, challengeID });
        res.sendStatus(200);
      } catch (e) {
        send400(res, e);
        return;
      }
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
}

async function getLeaderboard(req, res) {
  try {
    const userID = req.user.id;

    const championshipID = req.params.id;
    const leaderboardData = await LeaderboardHandler.getChampionshipLeaderboardData(championshipID);

    const leaderboard = leaderboardData.leaderboard;
    let userOnLeaderboard = false;
    if (leaderboard && leaderboard.length) {
      for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i];
        if (entry._id == userID) userOnLeaderboard = true;
        const username = await ObjectIDToNameHandler.getUsername(entry._id);
        entry.username = username;
      }
    }

    if (!userOnLeaderboard) {
      const result = await getUserPointsByUserID(championshipID, userID);
      if (result !== null) {
        const userResult = result.userPoints[0];
        leaderboardData.leaderboard.push({
          points: userResult.points,
          _id: userID,
          username: req.user.username,
          noRank: true,
        });
      }
    }

    const leaderboardResponse = {
      name: await ObjectIDToNameHandler.getChampionshipName(championshipID),
      leaderboard: leaderboardData.leaderboard,
      pointMap: leaderboardData.pointMap,
    };

    res.send(leaderboardResponse);
  } catch (e) {
    Logger.logError("ChampionshipController.getLeaderboard");
    res.sendStatus(500);
  }
}

module.exports = { awardPoints, getLeaderboard };

const send400 = (res, message) => {
  res.status(400);
  res.send(message);
};
