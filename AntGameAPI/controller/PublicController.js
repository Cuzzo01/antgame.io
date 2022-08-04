const Logger = require("../Logger");
const ChallengeDao = require("../dao/ChallengeDao");
const ActiveChallengesHandler = require("../handler/ActiveChallengesHandler");
const DailyChallengeHandler = require("../handler/DailyChallengeHandler");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");
const FlagHandler = require("../handler/FlagHandler");
const { GenerateChallengeLeaderboardData } = require("../helpers/LeaderboardHelper");
const { getUserLoginCount } = require("../dao/AdminDao");

async function getActiveChallenges(req, res) {
  try {
    const activeChallengeData = await ActiveChallengesHandler.getActiveChallenges();
    const activeChallenges = activeChallengeData.challenges;
    const worldRecords = activeChallengeData.worldRecords;

    const championshipData = await ActiveChallengesHandler.getChampionshipData();
    const yesterdaysDailyData = await ActiveChallengesHandler.getYesterdaysDailyData();

    const records = {};
    for (const [id, wr] of Object.entries(worldRecords)) {
      records[id] = { wr: wr };
    }

    const cacheTime = await FlagHandler.getFlagValue("time-to-cache-public-endpoints");
    res.set("Cache-Control", `public, max-age=${cacheTime}`);
    res.send({ challenges: activeChallenges, championshipData, records, yesterdaysDailyData });
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

    const currentDaily = await DailyChallengeHandler.getActiveDailyChallenge();
    if (challengeID.toLowerCase() === "daily") challengeID = currentDaily;

    const response = {
      name: await ObjectIDToNameHandler.getChallengeName(challengeID),
      leaderboard: leaderboardData.leaderboardRows,
      daily: leaderboardData.isDaily,
      solutionImage: leaderboardData.solutionImgPath,
      playerCount: leaderboardData.playerCount,
    };

    const cacheTime = await FlagHandler.getFlagValue("time-to-cache-public-endpoints");
    res.set("Cache-Control", `public, max-age=${cacheTime}`);

    res.send(response);
  } catch (e) {
    Logger.logError("PublicController.getLeaderboard", e);
    res.sendStatus(500);
  }
}

async function getDailyChallenges(req, res) {
  try {
    const result = await ChallengeDao.getDailyChallengesInReverseOrder({ limit: 40 });
    const mappedResult = result.map(config => {
      return { id: config._id, name: config.name };
    });

    res.set("Cache-Control", `public, max-age=60`);
    res.send(mappedResult);
  } catch (e) {
    Logger.logError("PublicController.getDailyChallenges", e);
    res.status(500);
    res.send("Get leader board failed");
  }
}

async function getGsgpData(req, res) {
  try {
    const activePlayers = await getUserLoginCount(24);
    const dailyLeaderboardData = await GenerateChallengeLeaderboardData({ challengeID: "daily" });

    const leaderboardToReturn = {};
    dailyLeaderboardData.leaderboardRows.forEach(entry => {
      leaderboardToReturn[entry.username] = entry.pb;
    });

    res.set("Cache-Control", `public, max-age=60`);
    res.send({
      name: "AntGame.io",
      active_players: activePlayers.value,
      leaderboards: {
        "Daily Challenge": leaderboardToReturn,
      },
    });
  } catch (e) {
    Logger.logError("PublicController.GetGsgpData", e);
    res.status(500);
    res.send("Get leader board failed");
  }
}
module.exports = { getActiveChallenges, getChallengeLeaderboard, getDailyChallenges, getGsgpData };
