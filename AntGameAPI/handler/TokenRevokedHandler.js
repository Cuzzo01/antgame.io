const { isUserBanned, isUserAdmin } = require("../dao/UserDao");
const { ResultCache } = require("../helpers/ResultCache");
const FlagHandler = require("../handler/FlagHandler");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");

class TokenRevokedHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "TokenRevokedHandler" });
    this.resultCache = new ResultCache();
  }

  async isTokenValid(userID, adminClaim) {
    const result = await this.getOrFetchValue({
      id: userID,
      getTimeToCache: async () => await FlagHandler.getFlagValue("time-between-token-checks"),
      fetchMethod: async () => {
        const IsBanned = await isUserBanned(userID);
        let IsAdmin = false;
        if (adminClaim) IsAdmin = await isUserAdmin(userID);
        return { banned: IsBanned, admin: IsAdmin };
      },
    });

    let IsValid = false;
    if (adminClaim) {
      IsValid = result.admin && !result.banned;
    } else {
      IsValid = !result.banned;
    }
    return IsValid;
  }

  async AreLoginsEnabled() {
    return (await FlagHandler.getFlagValue("allow-logins")) === true;
  }
}
const SingletonInstance = new TokenRevokedHandler();
module.exports = SingletonInstance;
