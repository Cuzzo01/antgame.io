const Logger = require("../Logger");
const ActiveChallengesHandler = require("../handler/ActiveChallengesHandler");
const LeaderboardHandler = require("../handler/LeaderboardHandler");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");
const FlagHandler = require("../handler/FlagHandler");
const { GenerateChallengeLeaderboardData } = require("../helpers/LeaderboardHelper");

async function getActiveChallenges(req, res) {
  try {
    const activeChallengeData = await ActiveChallengesHandler.getActiveChallenges();
    const activeChallenges = activeChallengeData.challenges;
    const worldRecords = activeChallengeData.worldRecords;

    const records = {};
    for (const [id, wr] of Object.entries(worldRecords)) {
      records[id] = { wr: wr };
    }

    const cacheTime = await FlagHandler.getFlagValue("time-to-cache-public-endpoints");
    res.set("Cache-Control", `public, max-age=${cacheTime}`);
    res.send({ challenges: activeChallenges, records: records });
  } catch (e) {
    Logger.logError("PublicController.getActiveChallenges", e);
    res.sendStatus(500);
  }
}

async function getChallengeLeaderboard(req, res) {
  try {
    let challengeID = req.params.id;

    const leaderboardData = await GenerateChallengeLeaderboardData({ challengeID });

    if (!leaderboardData) {
      res.status(404);
      res.send("Found no records for that challengeID");
      return;
    }

    const response = {
      name: await ObjectIDToNameHandler.getChallengeName(challengeID),
      leaderboard: leaderboardData.leaderboardRows,
      daily: leaderboardData.isDaily,
      solutionImage: leaderboardData.solutionImgPath,
    };

    if (await FlagHandler.getFlagValue("show-player-count-on-leaderboard"))
      response.playerCount = await LeaderboardHandler.getChallengePlayerCount(challengeID);

    const cacheTime = await FlagHandler.getFlagValue("time-to-cache-public-endpoints");
    res.set("Cache-Control", `public, max-age=${cacheTime}`);

    res.send(response);
  } catch (e) {
    Logger.logError("PublicController.getLeaderboard", e);
    res.sendStatus(500);
  }
}
module.exports = { getActiveChallenges, getChallengeLeaderboard };
