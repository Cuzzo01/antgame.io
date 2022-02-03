const { getChallengeByChallengeId } = require("../dao/ChallengeDao");
const { getChampionshipDetailsFromDB } = require("../dao/ChampionshipDao");
const { getUsernameByID } = require("../dao/UserDao");
const { ResultCache } = require("../helpers/ResultCache");
const Logger = require("../Logger");

class ObjectIDToNameHandler {
  constructor() {
    this.resultCache = new ResultCache();
    this.timeToCache = 3600; // 1 hour
  }

  async getChallengeName(id) {
    return await this.getOrFetchValue(id, "ChallengeName", async id => {
      const config = await getChallengeByChallengeId(id);
      return config.name;
    });
  }

  async getUsername(id) {
    return await this.getOrFetchValue(id, "Username", async id => {
      return await getUsernameByID(id);
    });
  }

  async getChampionshipName(id) {
    return await this.getOrFetchValue(id, "Championship", async id => {
      const championship = await getChampionshipDetailsFromDB(id);
      return championship.name;
    });
  }

  async getOrFetchValue(id, type, fetchMethod) {
    const startTime = new Date();

    const cacheResult = this.tryGetItemFromCache(id);
    if (cacheResult !== false) {
      this.logMessage({
        cacheMiss: false,
        result: cacheResult,
        id,
        startTime,
        type,
      });
      return cacheResult;
    } else {
      try {
        const result = await fetchMethod(id);
        const cacheTime = Math.round(this.timeToCache * (1 - (Math.random() * 0.2)));
        this.resultCache.setItem(id, result, cacheTime, new Date() - startTime);
        this.logMessage({
          cacheMiss: true,
          result,
          id,
          startTime,
          type,
        });
        return result;
      } catch (e) {
        Logger.logError("ObjectIDToNameHandler", e);
        return null;
      }
    }
  }

  logMessage = ({ cacheMiss, id, result, startTime, type }) => {
    Logger.logCacheResult(
      `ObjectIDToNameHandler/${type}`,
      cacheMiss,
      id,
      JSON.stringify(result),
      new Date() - startTime
    );
  };

  tryGetItemFromCache(id) {
    if (this.resultCache.isSetAndActive(id)) return this.resultCache.getValue(id);
    else return false;
  }
}
const SingletonInstance = new ObjectIDToNameHandler();
module.exports = SingletonInstance;
