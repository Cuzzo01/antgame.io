const Logger = require("../Logger");
const ActiveChallengesHandler = require("../handler/ActiveChallengesHandler");
const LeaderboardHandler = require("../handler/LeaderboardHandler");

async function healthCheck(req, res) {
  try {
    res.send("OK");
  } catch (e) {
    Logger.logError("ServiceController.healthCheck", e);
    res.sendStatus(500);
  }
}

async function dumpActiveChallengesCache(req, res) {
  try {
    ActiveChallengesHandler.unsetItem();

    res.sendStatus(200);
  } catch (e) {
    Logger.logError("ServiceController.dumpActiveChallengesCache", e);
    res.sendStatus(500);
  }
}

async function dumpLeaderboardCache(req, res) {
  try {
    const challengeID = req.params.id;

    if (!challengeID) {
      res.status(400);
      res.send("Must specify challengeID");
      return;
    }

    LeaderboardHandler.unsetItem(challengeID);

    res.sendStatus(200);
  } catch (e) {
    Logger.logError("ServiceController.dumpActiveChallengesCache", e);
    res.sendStatus(500);
  }
}

module.exports = { dumpActiveChallengesCache, dumpLeaderboardCache, healthCheck };
