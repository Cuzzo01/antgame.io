const { ResultCache } = require("../helpers/ResultCache");
const Logger = require("../Logger");

class ResultCacheWrapper {
  constructor({ name }) {
    this.resultCache = new ResultCache();
    this.name = name;
  }

  itemIsSet(id) {
    return this.resultCache.isSetAndActive(id);
  }

  getOrFetchValue = async ({ id, type, fetchMethod, getTimeToCache, logFormatter }) => {
    const startTime = new Date();
    const timeToCache = await getTimeToCache();

    const cacheResult = this.tryGetItemFromCache(id);
    if (cacheResult !== false) {
      const toReturn = await Promise.resolve(cacheResult);

      const toLog = {
        cacheMiss: false,
        id,
        startTime,
        type,
      };
      if (logFormatter) toLog.value = logFormatter(toReturn);
      else toLog.value = toReturn;
      this.logMessage(toLog);

      return toReturn;
    } else {
      try {
        const result = fetchMethod(id);
        this.resultCache.setItem(id, result, timeToCache, new Date() - startTime);

        const resolvedResult = await Promise.resolve(result);

        const toLog = {
          cacheMiss: true,
          id,
          startTime,
          type,
        };
        if (logFormatter) toLog.value = logFormatter(resolvedResult);
        else toLog.value = resolvedResult;
        this.logMessage(toLog);

        return resolvedResult;
      } catch (e) {
        Logger.logError(this.name, e);
        return null;
      }
    }
  };

  logMessage = ({ cacheMiss, id, startTime, type, value }) => {
    const nameString = type ? `${this.name}/${type}` : this.name;
    Logger.logCacheResult(nameString, cacheMiss, id, value, new Date() - startTime);
  };

  tryGetItemFromCache = id => {
    if (this.resultCache.isSetAndActive(id)) return this.resultCache.getValue(id);
    else return false;
  };

  unsetItem(id) {
    this.resultCache.expireValue(id);
  }

  unsetAll() {
    this.resultCache = new ResultCache();
  }

  getTimeToExpire = id => {
    if (this.resultCache.isSetAndActive(id)) {
      return this.resultCache.getTimeToExpire(id);
    }
    return 0;
  };
}
module.exports = { ResultCacheWrapper };
