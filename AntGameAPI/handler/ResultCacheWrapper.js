const { ResultCache } = require("../helpers/ResultCache");
const Logger = require("../Logger");

class ResultCacheWrapper {
  constructor({ name }) {
    this.resultCache = new ResultCache();
    this.name = name;
  }

  getOrFetchValue = async ({ id, type, fetchMethod, getTimeToCache }) => {
    const startTime = new Date();

    const cacheResult = this.tryGetItemFromCache(id);
    if (cacheResult !== false) {
      this.logMessage({
        cacheMiss: false,
        id,
        startTime,
        type,
      });
      return cacheResult;
    } else {
      try {
        const result = await fetchMethod(id);
        const timeToCache = await getTimeToCache();
        this.resultCache.setItem(id, result, timeToCache, new Date() - startTime);
        this.logMessage({
          cacheMiss: true,
          id,
          startTime,
          type,
        });
        return result;
      } catch (e) {
        Logger.logError(this.name, e);
        return null;
      }
    }
  };

  logMessage = ({ cacheMiss, id, startTime, type }) => {
    Logger.logCacheResult(`${this.name}/${type}`, cacheMiss, id, "", new Date() - startTime);
  };

  tryGetItemFromCache = id => {
    if (this.resultCache.isSetAndActive(id)) return this.resultCache.getValue(id);
    else return false;
  };

  unsetItem = id => {
    this.resultCache.expireValue(id);
  };

  unsetAll = () => {
    this.resultCache = new ResultCache();
  };

  getTimeToExpire = id => {
    if (this.resultCache.isSetAndActive(id)) {
      return this.resultCache.getTimeToExpire(id);
    }
    return 0;
  };
}
module.exports = { ResultCacheWrapper };
