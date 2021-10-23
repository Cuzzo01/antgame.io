const { getChallengeByChallengeId } = require("../dao/ChallengeDao");
const { ResultCache } = require("../helpers/ResultCache");
const Logger = require("../Logger");

class ChallengeIdToChallengeNameHandler {
  constructor() {
    this.resultCache = new ResultCache();
    this.timeToCache = 600; // 10 min
  }

  async getChallengeName(id) {
    const startTime = new Date();
    if (this.resultCache.isSetAndActive(id)) {
      const result = this.resultCache.getValue(id);
      Logger.logCacheResult(
        "ChallengeIdToChallengeNameHandler",
        false,
        id,
        result,
        new Date() - startTime
      );
      if (result !== null) return result;
      return null;
    } else {
      try {
        const config = await getChallengeByChallengeId(id);
        this.resultCache.setItem(id, config.name, this.timeToCache, new Date() - startTime);
        Logger.logCacheResult("ChallengeIdToChallengeNameHandler", true, id, config.name);
        return config.name;
      } catch (e) {
        console.error(`getChallengeName called with non-existent ID : ${id}`);
        return null;
      }
    }
  }
}
const SingletonInstance = new ChallengeIdToChallengeNameHandler();
module.exports = SingletonInstance;
