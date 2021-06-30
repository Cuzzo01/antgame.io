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

async function getChallenge(req, res) {
  const id = req.params.id;
  try {
    const config = await ChallengeDao.getChallengeById(id);
    res.send(config);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get challenge failed");
  }
}

async function getActiveChallenges(req, res) {
  try {
    const activeChallenges = await ChallengeDao.getActiveChallenges();
    res.send(activeChallenges);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get challenge failed");
  }
}

module.exports = { postRun, getChallenge, getActiveChallenges };
