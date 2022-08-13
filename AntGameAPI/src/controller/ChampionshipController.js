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
    const leaderboard = [...leaderboardData.leaderboard];
    let lastPointsAwarded = false;
    if (leaderboardData.lastPointsAwarded)
      lastPointsAwarded = [...leaderboardData.lastPointsAwarded];

    const usernamePromises = new Map();

    let userOnLeaderboard = false;
    leaderboard.forEach(entry => {
      const id = entry._id.toString();
      if (id == userID) userOnLeaderboard = true;
      usernamePromises.set(
        id,
        ObjectIDToNameHandler.getUsername(id).then(name => {
          return { id: id, name: name };
        })
      );
    });

    if (!userOnLeaderboard) {
      const result = await getUserPointsByUserID(championshipID, userID);
      if (result !== null) {
        const userResult = result.userPoints[0];
        usernamePromises.set(userID, Promise.resolve({ id: userID, name: req.user.username }));
        leaderboard.push({
          points: userResult.points,
          _id: userID,
          noRank: true,
        });
      }
    }

    if (lastPointsAwarded)
      lastPointsAwarded.forEach(entry => {
        const id = entry.userID.toString();
        if (!usernamePromises.has(id))
          usernamePromises.set(
            id,
            ObjectIDToNameHandler.getUsername(id).then(name => {
              return { id: id, name: name };
            })
          );
      });

    const usernames = {};
    await Promise.all(usernamePromises.values()).then(results => {
      results.forEach(userData => {
        usernames[userData.id] = userData.name;
      });
    });

    const leaderboardResponse = {
      name: await ObjectIDToNameHandler.getChampionshipName(championshipID),
      leaderboard: leaderboard,
      pointMap: leaderboardData.pointMap,
      lastPointsAwarded: lastPointsAwarded,
      usernames: usernames,
    };

    res.send(leaderboardResponse);
  } catch (e) {
    Logger.logError("ChampionshipController.getLeaderboard", e);
    res.sendStatus(500);
  }
}

module.exports = { awardPoints, getLeaderboard };

const send400 = (res, message) => {
  res.status(400);
  res.send(message);
};
