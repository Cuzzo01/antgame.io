const { RejectIfAnon } = require("../auth/AuthHelpers");
const ChallengeDao = require("../dao/ChallengeDao");
const UserDao = require("../dao/UserDao");

async function postRun(req, res) {
  try {
    const user = req.user;
    const runData = req.body.data;

    let saveRun = false;
    if (runData.PB) {
      const CurrentDetails = await UserDao.getChallengeDetailsByUser(
        user.id,
        runData.challengeID
      );
      if (CurrentDetails === null) saveRun = "New challenge";
      else if (CurrentDetails.pb < runData.Score) saveRun = "New PB";
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
        submissionTime: new Date().toISOString(),
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

    if (saveRun === "New PB") {
      UserDao.updateChallengePBAndRunCount(
        user.id,
        runData.challengeID,
        runData.Score,
        runID
      );
    } else if (saveRun === "New challenge") {
      UserDao.addNewChallengeDetails(
        user.id,
        runData.challengeID,
        runData.Score,
        runID
      );
    } else {
      UserDao.incrementChallengeRunCount(user.id, runData.challengeID);
    }

    res.send("OK");
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
    const activeChallenges = await ChallengeDao.getActiveChallenges();
    res.send(activeChallenges);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get challenge failed");
  }
}

async function getRecords(req, res) {
  try {
    if (RejectIfAnon(req, res)) return;
    const user = req.user;
    const challengeID = req.params.id;

    // const record = await ChallengeDao.getChallengePBByUser(
    //   user.id,
    //   challengeID
    // );
    const challengeDetails = await UserDao.getChallengeDetailsByUser(
      user.id,
      challengeID
    );
    if (challengeDetails === null) {
      res.sendStatus(404);
      return;
    }
    const recordResponse = {
      pb: challengeDetails.pb,
    };
    res.send(recordResponse);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get run details failed");
  }
}

module.exports = { postRun, getChallenge, getActiveChallenges, getRecords };
