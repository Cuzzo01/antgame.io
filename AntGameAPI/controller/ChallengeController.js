const ChallengeDao = require("../dao/ChallengeDao");

async function postRun(req, res) {
  try {
    const runData = req.body.data;

    let runRecord = {
      score: runData.Score,
      submissionTime: new Date().toISOString(),
      name: runData.Name,
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
    const result = await ChallengeDao.submitRun(runRecord);

    res.send("OK");
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Save failed");
  }
}

module.exports = { postRun };
