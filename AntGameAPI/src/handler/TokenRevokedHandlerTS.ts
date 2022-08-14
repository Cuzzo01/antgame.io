import { LoggerProvider } from "../LoggerTS";
import { TokenRevokedData } from "../models/TokenRevokedData";
import { ResultCacheWrapper } from "./ResultCacheWrapperTS";

const { isUserBanned, isUserAdmin } = require("../dao/UserDao");
const FlagHandler = require("./FlagHandler");

const Logger = LoggerProvider.getInstance();

export class TokenRevokedHandler {
  private static cache: TokenRevokedCache;

  static getCache(): TokenRevokedCache {
    if (this.cache) return this.cache;
    this.cache = new TokenRevokedCache();
    return this.cache;
  }
}

class TokenRevokedCache extends ResultCacheWrapper<TokenRevokedData> {
  private tokenRevokedTime: number;

  constructor() {
    super({ name: "TokenRevokedHandler" });
  }

  async isTokenValid(userID: string, adminClaim: boolean, issuedAt: number): Promise<boolean> {
    if (this.tokenRevokedTime && this.tokenRevokedTime > issuedAt) {
      Logger.logError("TokenRevokedHandler", "Rejecting revoked token");
      return false;
    }

    const result = await this.getOrFetchValue({
      id: userID,
      getTimeToCache: async () => await FlagHandler.getFlagValue("time-between-token-checks"),
      fetchMethod: async () => {
        const IsBanned = (await isUserBanned(userID)) as boolean;
        let IsAdmin = false;
        if (adminClaim) IsAdmin = (await isUserAdmin(userID)) as boolean;
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

  async AreLoginsEnabled(): Promise<boolean> {
    return (await FlagHandler.getFlagValue("allow-logins")) === true;
  }

  RevokeTokens(): void {
    this.tokenRevokedTime = Math.round(new Date().getTime() / 1000);
  }
}
