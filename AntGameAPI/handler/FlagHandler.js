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
    if (!this.timeToCache || !this.timeToCache.isActive()) await this.refreshTimeToCache();
    const timeToCache = await Promise.resolve(this.timeToCache.getValue());

    if (this.resultCache.isSetAndActive(name)) {
      const result = await Promise.resolve(this.resultCache.getValue(name));
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
      let value;
      try {
        value = getFlag(name);
      } catch (e) {
        value = null;
      }
      this.resultCache.setItem(name, value, timeToCache);
      const resolvedValue = await Promise.resolve(value);

      Logger.logCacheResult(
        "FlagHandler",
        true,
        name,
        JSON.stringify(resolvedValue),
        new Date() - startTime
      );
      return resolvedValue;
    }
  }

  async refreshTimeToCache() {
    const timeToCache = getFlag("timeToCacheFlags");
    this.timeToCache = new ExpiringResult(30, timeToCache);

    const result = await timeToCache;
    const expireAt = new Date();
    expireAt.setSeconds(expireAt.getSeconds() + result);
    this.timeToCache = new ExpiringResult(expireAt, result);
    return;
  }
}
const SingletonInstance = new FlagHandler();
module.exports = SingletonInstance;
