const { getChallengeByChallengeId } = require("../dao/ChallengeDao");
const {
  getLeaderboardByChampionshipID,
  getChampionshipDetailsFromDB,
  getLastPointsAwarded,
} = require("../dao/ChampionshipDao");
const { getLeaderboardByChallengeId } = require("../dao/UserDao");
const { ResultCache } = require("../helpers/ResultCache");
const Logger = require("../Logger");

class LeaderboardHandler {
  constructor() {
    this.resultCache = new ResultCache();
    this.timeToCache = 3600; // 1 hour
  }

  async getChallengeLeaderboard(id) {
    return await this.getOrFetchValue(id, "Challenge", async id => {
      return await getLeaderboardByChallengeId(id, 15);
    });
  }

  async getChampionshipLeaderboardData(id) {
    return await this.getOrFetchValue(id, "Championship", async id => {
      const leaderboard = getLeaderboardByChampionshipID(id, 50);
      const data = getChampionshipDetailsFromDB(id);
      const toReturn = {
        leaderboard: await leaderboard,
        pointMap: (await data).pointsMap,
      };

      const lastPointsAwardedID = await getLastPointsAwarded(id);
      if (lastPointsAwardedID) {
        const lastPointsAwardedChallenge = await getChallengeByChallengeId(
          lastPointsAwardedID.toString()
        );
        toReturn.lastPointsAwarded = lastPointsAwardedChallenge.pointsAwarded;
      }

      return toReturn;
    });
  }

  async getOrFetchValue(id, type, fetchMethod) {
    const startTime = new Date();

    const cacheResult = this.tryGetItemFromCache(id);
    if (cacheResult !== false) {
      this.logMessage({
        cacheMiss: false,
        result: {},
        id,
        startTime,
        type,
      });
      return cacheResult;
    } else {
      try {
        const result = await fetchMethod(id);
        this.resultCache.setItem(id, result, this.timeToCache, new Date() - startTime);
        this.logMessage({
          cacheMiss: true,
          result: {},
          id,
          startTime,
          type,
        });
        return result;
      } catch (e) {
        Logger.logError("LeaderboardHandler", e);
        return null;
      }
    }
  }

  logMessage = ({ cacheMiss, id, result, startTime, type }) => {
    Logger.logCacheResult(
      `LeaderboardHandler/${type}`,
      cacheMiss,
      id,
      JSON.stringify(result),
      new Date() - startTime
    );
  };

  tryGetItemFromCache = id => {
    if (this.resultCache.isSetAndActive(id)) return this.resultCache.getValue(id);
    else return false;
  };

  unsetLeaderboard = id => {
    this.resultCache.expireValue(id);
  };

  unsetAll = () => {
    this.resultCache = new ResultCache();
  };
}
const SingletonInstance = new LeaderboardHandler();
module.exports = SingletonInstance;
