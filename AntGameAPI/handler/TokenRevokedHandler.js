const { getFlag } = require("../dao/FlagDao");
const { isUserBanned, isUserAdmin } = require("../dao/UserDao");
const { ExpiringResult } = require("../helpers/ExpiringResult");
const { ResultCache } = require("../helpers/ResultCache");
const FlagHandler = require("../handler/FlagHandler");
const Logger = require("../Logger");

class TokenRevokedHandler {
  constructor() {
    this.resultCache = new ResultCache();
  }

  async isTokenValid(userID, adminClaim) {
    const startTime = new Date();
    if (this.resultCache.isSetAndActive(userID)) {
      const result = this.resultCache.getValue(userID);
      let IsValid = false;
      if (adminClaim) {
        IsValid = result.admin && !result.banned;
      } else {
        IsValid = !result.banned;
      }
      Logger.logCacheResult("TokenRevokedHandler", false, userID, IsValid, new Date() - startTime);
      return IsValid;
    } else {
      let IsValid;
      try {
        const IsBanned = await isUserBanned(userID);
        let IsAdmin = false;
        if (adminClaim) {
          IsAdmin = await isUserAdmin(userID);
          IsValid = IsAdmin && !IsBanned;
          if (!IsAdmin)
            Logger.logAuthEvent(`Token claiming admin is not admin`, { userID: userID });
        } else {
          IsValid = !IsBanned;
        }
        const timeToCache = await FlagHandler.getFlagValue("time-between-token-checks");
        this.resultCache.setItem(userID, { banned: IsBanned, admin: IsAdmin }, timeToCache);
      } catch (e) {
        console.error(`Threw error getting token status in TokenRevokedHandler (${userID})`, e);
        return false;
      }
      Logger.logCacheResult("TokenRevokedHandler", true, userID, IsValid, new Date() - startTime);
      return IsValid;
    }
  }

  async AreLoginsEnabled() {
    return await FlagHandler.getFlagValue("allow-logins");
  }
}
const SingletonInstance = new TokenRevokedHandler();
module.exports = SingletonInstance;
