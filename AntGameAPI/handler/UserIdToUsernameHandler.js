const { getUsernameByID } = require("../dao/UserDao");
const { ResultCache } = require("../helpers/ResultCache");
const Logger = require("../Logger");

class UserIdToUsernameHandler {
  constructor() {
    this.resultCache = new ResultCache();
    this.timeToCache = 600; // 10 min
  }

  async getUsername(id) {
    if (this.resultCache.isSetAndActive(id)) {
      const result = this.resultCache.getValue(id);
      Logger.logCacheResult("UserIdToUsernameHandler", false, id, result);
      if (result !== null) return result;
      return null;
    } else {
      try {
        const value = await getUsernameByID(id);
        this.resultCache.setItem(id, value, this.timeToCache);
        Logger.logCacheResult("UserIdToUsernameHandler", true, id, value);
        return value;
      } catch (e) {
        console.error(`getUsername called with non-existent ID : ${id}`);
        return null;
      }
    }
  }
}
const SingletonInstance = new UserIdToUsernameHandler();
module.exports = SingletonInstance;
