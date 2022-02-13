const { getUserBadgesByID } = require("../dao/UserDao");
const { ResultCache } = require("../helpers/ResultCache");
const Logger = require("../Logger");
const FlagHandler = require("./FlagHandler");

class UserHandler {
  constructor() {
    this.resultCache = new ResultCache();
  }

  async getBadges(id) {
    return await this.getOrFetchValue(id, async id => {
      const badges = await getUserBadgesByID(id);
      badges.sort((a, b) => (a.value < b.value ? 1 : -1));
      return badges.slice(0, 5).map(badge => {
        return {
          name: badge.name,
          color: badge.color,
          icon: badge.icon,
          backgroundColor: badge.backgroundColor,
        };
      });
    });
  }

  async getOrFetchValue(id, fetchMethod) {
    const startTime = new Date();

    const cacheResult = this.tryGetItemFromCache(id);
    if (cacheResult !== false) {
      this.logMessage({
        cacheMiss: false,
        id,
        startTime,
      });
      return { badges: cacheResult, ttl: this.resultCache.getTimeToExpire(id) };
    } else {
      try {
        const result = await fetchMethod(id);
        const maxTimeToCache = await FlagHandler.getFlagValue("time-to-cache-badges");
        const cacheTime = Math.round(maxTimeToCache * (1 - Math.random() * 0.2));
        this.resultCache.setItem(id, result, cacheTime, new Date() - startTime);
        this.logMessage({
          cacheMiss: true,
          id,
          startTime,
        });
        return { badges: result, ttl: cacheTime };
      } catch (e) {
        Logger.logError("UserHandler", e);
        return {};
      }
    }
  }

  logMessage = ({ cacheMiss, id, startTime }) => {
    Logger.logCacheResult(`UserHandler`, cacheMiss, id, {}, new Date() - startTime);
  };

  tryGetItemFromCache(id) {
    if (this.resultCache.isSetAndActive(id)) return this.resultCache.getValue(id);
    else return false;
  }
}
const SingletonInstance = new UserHandler();
module.exports = SingletonInstance;
