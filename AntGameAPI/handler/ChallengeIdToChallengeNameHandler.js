const { getChallengeByChallengeId } = require("../dao/ChallengeDao");
const { ResultCache } = require("../helpers/ResultCache");

class ChallengeIdToChallengeNameHandler {
  constructor() {
    this.resultCache = new ResultCache();
    this.timeToCache = 600; // 10 min
  }

  async getChallengeName(id) {
    if (this.resultCache.isSetAndActive(id)) {
      const result = this.resultCache.getValue(id);
      Logger.logCacheResult("ChallengeIdToChallengeNameHandler", false, id, result);
      if (result !== null) return result;
      return null;
    } else {
      try {
        const config = await getChallengeByChallengeId(id);
        this.resultCache.setItem(id, config.name, this.timeToCache);
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
