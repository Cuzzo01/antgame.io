const { getFlag } = require("../dao/FlagDao");
const { ExpiringResult } = require("../helpers/ExpiringResult");
const { ResultCache } = require("../helpers/ResultCache");
const Logger = require("../Logger");

class FlagHandler {
  constructor() {
    this.resultCache = new ResultCache();
    this.timeToCache = null;
  }

  getFlagTTL(name) {
    if (this.resultCache.isSetAndActive(name)) return this.resultCache.getTimeToExpire(name);
    else return false;
  }

  async getFlagValue(name) {
    const startTime = new Date();
    if (this.resultCache.isSetAndActive(name)) {
      const result = this.resultCache.getValue(name);
      Logger.logCacheResult(
        "FlagHandler",
        false,
        name,
        JSON.stringify(result),
        new Date() - startTime
      );
      if (result !== null) return result;
      return null;
    } else {
      if (!this.timeToCache || !this.timeToCache.isActive()) await this.refreshTimeToCache();

      let value;
      try {
        value = await getFlag(name);
        this.resultCache.setItem(name, value, this.timeToCache.getValue());
      } catch (e) {
        value = null;
        this.resultCache.setItem(name, null, this.timeToCache.getValue());
      }
      Logger.logCacheResult(
        "FlagHandler",
        true,
        name,
        JSON.stringify(value),
        new Date() - startTime
      );
      return value;
    }
  }

  async refreshTimeToCache() {
    const timeToCache = await getFlag("timeToCacheFlags");
    const expireAt = new Date();
    expireAt.setSeconds(expireAt.getSeconds() + timeToCache);
    this.timeToCache = new ExpiringResult(expireAt, timeToCache);
    return;
  }
}
const SingletonInstance = new FlagHandler();
module.exports = SingletonInstance;
