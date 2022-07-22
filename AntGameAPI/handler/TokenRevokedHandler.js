const { isUserBanned, isUserAdmin } = require("../dao/UserDao");
const FlagHandler = require("../handler/FlagHandler");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");
const Logger = require("../Logger");

class TokenRevokedHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "TokenRevokedHandler" });
  }

  async isTokenValid(userID, adminClaim, issuedAt) {
    if (this.tokenRevokedTime && this.tokenRevokedTime > issuedAt) {
      Logger.logError("TokenRevokedHandler", "Rejecting revoked token");
      return false;
    }

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

  RevokeTokens() {
    this.tokenRevokedTime = Math.round(new Date().getTime() / 1000);
  }
}
const SingletonInstance = new TokenRevokedHandler();
module.exports = SingletonInstance;
