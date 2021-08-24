const { getUsernameByID } = require("../dao/UserDao");
const { ResultCache } = require("../helpers/ResultCache");

class UserIdToUsernameHandler {
  constructor() {
    this.resultCache = new ResultCache();
    this.timeToCache = 600; // 10 min
  }

  async getUsername(id) {
    if (this.resultCache.isSetAndActive(id)) {
      const result = this.resultCache.getValue(id);
      if (result !== null) return result;
      return null;
    } else {
      try {
        const value = await getUsernameByID(id);
        this.resultCache.setItem(id, value, this.timeToCache);
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
