import { LoggerProvider } from "../LoggerTS";
import { FlagHandler } from "./FlagHandler";
import { ResultCacheWrapper } from "./ResultCacheWrapper";

import { TokenRevokedData } from "../models/TokenRevokedData";
import { UserDao } from "../dao/UserDao";

const Logger = LoggerProvider.getInstance();
const FlagCache = FlagHandler.getCache();

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
  private _userDao: UserDao;

  constructor() {
    super({ name: "TokenRevokedHandler" });
    this._userDao = new UserDao();
  }

  get size() {
    return super.getSize();
  }

  async isTokenValid(userID: string, adminClaim: boolean, issuedAt: number): Promise<boolean> {
    if (this.tokenRevokedTime && this.tokenRevokedTime > issuedAt) {
      Logger.logError("TokenRevokedHandler", "Rejecting revoked token");
      return false;
    }

    const result = await this.getOrFetchValue({
      id: userID,
      getTimeToCache: async () => await FlagCache.getIntFlag("time-between-token-checks"),
      fetchMethod: async () => {
        const IsBanned = await this._userDao.isUserBanned(userID);
        let IsAdmin = false;
        if (adminClaim) IsAdmin = await this._userDao.isUserAdmin(userID);
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
    return await FlagCache.getBoolFlag("allow-logins");
  }

  public unsetItem(id: string): void {
    super.unsetItem(id);
  }

  RevokeTokens(): void {
    this.tokenRevokedTime = Math.round(new Date().getTime() / 1000);
  }
}
