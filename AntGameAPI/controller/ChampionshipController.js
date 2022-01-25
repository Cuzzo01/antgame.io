const { ChampionshipOrchestrator } = require("../bll/ChampionshipOrchestrator");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");
const LeaderboardHandler = require("../handler/LeaderboardHandler");

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
    const championshipID = req.params.id;
    const result = await LeaderboardHandler.getChampionshipLeaderboard(championshipID);

    if (result && result.length) {
      for (let i = 0; i < result.length; i++) {
        const entry = result[i];
        const username = await ObjectIDToNameHandler.getUsername(entry._id);
        entry.username = username;
      }
    }

    const leaderboardResponse = {
      name: await ObjectIDToNameHandler.getChampionshipName(championshipID),
      leaderboard: result,
    };

    res.send(leaderboardResponse);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
}

module.exports = { awardPoints, getLeaderboard };

const send400 = (res, message) => {
  res.status(400);
  res.send(message);
};
