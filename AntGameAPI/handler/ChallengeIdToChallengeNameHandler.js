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
      if (result !== null) return result;
      return null;
    } else {
      try {
        const config = await getChallengeByChallengeId(id);
        this.resultCache.setItem(id, config.name, this.timeToCache);
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
