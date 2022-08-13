const Logger = require("../Logger");
const ActiveChallengesHandler = require("../handler/ActiveChallengesHandler");
const LeaderboardHandler = require("../handler/LeaderboardHandler");
const { GenerateSolutionImage } = require("../bll/RecordImageGenerator");
const { addSolutionImageToRun } = require("../dao/ChallengeDao");

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

async function generateRecordImage(req, res) {
  try {
    const runID = req.body.runID;
    const foodEaten = req.body.foodEaten;

    const imagePath = await GenerateSolutionImage({ runID, foodEaten });

    await addSolutionImageToRun({ runID, imagePath });
    res.sendStatus(200);
  } catch (e) {
    Logger.logError("ServiceController.dumpActiveChallengesCache", e);
    res.sendStatus(500);
  }
}
module.exports = {
  dumpActiveChallengesCache,
  dumpLeaderboardCache,
  healthCheck,
  generateRecordImage,
};
