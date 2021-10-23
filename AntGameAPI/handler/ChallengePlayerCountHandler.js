const { getPlayerCountByChallengeID } = require("../dao/UserDao");
const { ResultCache } = require("../helpers/ResultCache");
const FlagHandler = require("./FlagHandler");
const Logger = require("../Logger");

class ChallengePlayerCountHandler {
  constructor() {
    this.resultCache = new ResultCache();
  }

  async getPlayerCount(challengeID) {
    const startTime = new Date();
    if (this.resultCache.isSetAndActive(challengeID)) {
      const result = this.resultCache.getValue(challengeID);
      Logger.logCacheResult(
        "ChallengePlayerCountHandler",
        false,
        challengeID,
        result,
        new Date() - startTime
      );
      if (result !== null) return result;
      return null;
    } else {
      try {
        const value = await getPlayerCountByChallengeID(challengeID);
        const timeToCache = await FlagHandler.getFlagValue("player-count-cache-time");
        this.resultCache.setItem(challengeID, value, timeToCache);
        Logger.logCacheResult(
          "ChallengePlayerCountHandler",
          true,
          challengeID,
          value,
          new Date() - startTime
        );
        return value;
      } catch (e) {
        console.error(`getPlayerCount called with non-existent ID : ${challengeID}`);
        return null;
      }
    }
  }

  unsetPlayerCount(challengeID) {
    this.resultCache.expireValue(challengeID);
  }
}
const SingletonInstance = new ChallengePlayerCountHandler();
module.exports = SingletonInstance;
