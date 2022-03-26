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
      const data = await Promise.resolve(this.resultCache.getValue(name));
      Logger.logCacheResult(
        "FlagHandler",
        false,
        name,
        JSON.stringify(data),
        new Date() - startTime
      );
      if (data !== null) return data.value;
      return null;
    } else {
      let data;
      try {
        data = getFlag(name);
      } catch (e) {
        data = null;
      }
      this.resultCache.setItem(name, data, timeToCache);
      const resolvedData = await Promise.resolve(data);

      Logger.logCacheResult(
        "FlagHandler",
        true,
        name,
        JSON.stringify(resolvedData),
        new Date() - startTime
      );
      return resolvedData.value;
    }
  }

  async getFlagData(name) {
    if (!this.resultCache.isSetAndActive(name)) await this.getFlagValue(name);

    const flagData = await Promise.resolve(this.resultCache.getValue(name));
    return {
      value: flagData.value,
      bypassCache: flagData.bypassCache,
    };
  }

  async refreshTimeToCache() {
    const timeToCache = getFlag("timeToCacheFlags");
    this.timeToCache = new ExpiringResult(30, timeToCache);

    const result = (await timeToCache).value;
    const expireAt = new Date();
    expireAt.setSeconds(expireAt.getSeconds() + result);
    this.timeToCache = new ExpiringResult(expireAt, result);
    return;
  }
}
const SingletonInstance = new FlagHandler();
module.exports = SingletonInstance;
