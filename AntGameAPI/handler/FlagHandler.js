const { getFlag } = require("../dao/FlagDao");
const { ExpiringResult } = require("../helpers/ExpiringResult");
const { ResultCache } = require("../helpers/ResultCache");

class FlagHandler {
  constructor() {
    this.resultCache = new ResultCache();
    this.timeToCache = null;
  }

  async getFlagValue(name) {
    if (this.resultCache.isSetAndActive(name)) {
      const result = this.resultCache.getValue(name);
      if (result !== null) return result;
      else {
        console.error(`getFlagValue called for non-existent flag : ${name}`);
        return null;
      }
    } else {
      if (!this.timeToCache || !this.timeToCache.isActive()) await this.refreshTimeToCache();

      let value;
      try {
        value = await getFlag(name);
        this.resultCache.setItem(name, value, this.timeToCache.getValue());
      } catch (e) {
        console.error(`getFlagValue called for non-existent flag : ${name}`);
        this.resultCache.setItem(name, null, this.timeToCache.getValue());
        return null;
      }
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
