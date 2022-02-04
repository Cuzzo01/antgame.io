const { getMapByID } = require("../dao/MapDao");
const { ResultCache } = require("../helpers/ResultCache");
const Logger = require("../Logger");

class MapHandler {
  constructor() {
    this.resultCache = new ResultCache();
    this.timeToCache = 3600; // 1 hour
  }

  async getMapData({ mapID }) {
    return await this.getOrFetchValue(mapID, async () => {
      const mapData = await getMapByID({ mapID: mapID });
      return {
        url: mapData.url,
        name: mapData.name,
        foodCount: mapData.foodCount,
      };
    });
  }

  async getOrFetchValue(id, fetchMethod) {
    const startTime = new Date();

    const cacheResult = this.tryGetItemFromCache(id);
    if (cacheResult !== false) {
      this.logMessage({
        cacheMiss: false,
        result: cacheResult,
        id,
        startTime,
      });
      return cacheResult;
    } else {
      try {
        const result = await fetchMethod(id);
        const cacheTime = Math.round(this.timeToCache * (1 - Math.random() * 0.2));
        this.resultCache.setItem(id, result, cacheTime, new Date() - startTime);
        this.logMessage({
          cacheMiss: true,
          result,
          id,
          startTime,
        });
        return result;
      } catch (e) {
        Logger.logError("ObjectIDToNameHandler", e);
        return null;
      }
    }
  }

  logMessage = ({ cacheMiss, id, result, startTime }) => {
    Logger.logCacheResult(
      `MapHandler`,
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
const SingletonInstance = new MapHandler();
module.exports = SingletonInstance;
