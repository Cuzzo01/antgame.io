const { getLeaderboardByChallengeId } = require("../dao/UserDao");
const { ResultCache } = require("../helpers/ResultCache");
const Logger = require("../Logger");

class LeaderboardHandler {
  constructor() {
    this.resultCache = new ResultCache();
    this.timeToCache = 3600; // 1 hour
  }

  async getChallengeLeaderboard(id) {
    const startTime = new Date();

    const cacheResult = this.tryGetItemFromCache(id);
    if (cacheResult !== false) {
      this.logMessage({
        cacheMiss: false,
        result: cacheResult,
        id: id,
        startTime,
      });
      return cacheResult;
    } else {
      try {
        const leaderboard = await getLeaderboardByChallengeId(id, 15);
        this.resultCache.setItem(id, leaderboard, this.timeToCache, new Date() - startTime);
        this.logMessage({
          cacheMiss: true,
          result: leaderboard,
          id,
          startTime,
        });
        return leaderboard;
      } catch (e) {
        console.error(`getChallengeLeaderboard called with non-existent ID : ${id}`);
        return null;
      }
    }
  }

  logMessage = ({ cacheMiss, id, result, startTime }) => {
    Logger.logCacheResult(
      "LeaderboardHandler",
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
}
const SingletonInstance = new LeaderboardHandler();
module.exports = SingletonInstance;
