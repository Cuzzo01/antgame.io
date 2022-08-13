import { HomePageResponse } from "../models/HomePageResponse";

const Logger = require("../Logger");
const ChallengeDao = require("../dao/ChallengeDao");
const ActiveChallengesHandler = require("../handler/ActiveChallengesHandler");
const DailyChallengeHandler = require("../handler/DailyChallengeHandler");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");
const FlagHandler = require("../handler/FlagHandler");
const UserHandler = require("../handler/UserHandler");
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

    const response: HomePageResponse = {

    }

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

    const dailyChallengeID = await DailyChallengeHandler.getActiveDailyChallenge();
    const dailyLeaderboardData = await GenerateChallengeLeaderboardData({
      challengeID: dailyChallengeID.toString(),
    });
    const dailyChallengeName = await ObjectIDToNameHandler.getChallengeName(dailyChallengeID);
    const dailyLeaderboard = {};
    dailyLeaderboardData.leaderboardRows.forEach(entry => {
      dailyLeaderboard[entry.username] = entry.pb;
    });

    const yesterdaysDailyID = await DailyChallengeHandler.getYesterdaysDailyChallenge();
    const yesterdaysLeaderboardData = await GenerateChallengeLeaderboardData({
      challengeID: yesterdaysDailyID.toString(),
    });
    const yesterdaysChallengeName = await ObjectIDToNameHandler.getChallengeName(yesterdaysDailyID);
    const yesterdaysLeaderboard = {};
    yesterdaysLeaderboardData.leaderboardRows.forEach(entry => {
      yesterdaysLeaderboard[entry.username] = entry.pb;
    });

    res.set("Cache-Control", `public, max-age=600`);
    res.send({
      name: "AntGame.io",
      active_players: activePlayers.value,
      leaderboards: {
        [dailyChallengeName]: dailyLeaderboard,
        [`${yesterdaysChallengeName} (FINAL)`]: yesterdaysLeaderboard,
      },
    });
  } catch (e) {
    Logger.logError("PublicController.GetGsgpData", e);
    res.status(500);
    res.send("Get leader board failed");
  }
}

async function getUserBadges(req, res) {
  try {
    const userID = req.params.id;

    if (!userID) {
      res.sendStatus(400);
      return;
    }

    const badges = await UserHandler.getBadges(userID);
    const ttl = UserHandler.getTimeToExpire(userID);

    if (ttl) {
      const maxCacheTime = await FlagHandler.getFlagValue("time-to-cache-badges-external");
      const age = maxCacheTime - ttl;
      res.set(`Cache-Control`, `public, max-age=${maxCacheTime}`);
      if (age > 0) res.set(`Age`, age);
    }

    if (badges) res.send(badges);
    else res.send([]);
  } catch (e) {
    Logger.logError("PublicController.getUserBadges", e);
    res.send(500);
  }
}

module.exports = {
  getActiveChallenges,
  getChallengeLeaderboard,
  getDailyChallenges,
  getGsgpData,
  getUserBadges,
};
