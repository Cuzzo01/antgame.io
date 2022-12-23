import { UserDao } from "../dao/UserDao";
import { TimeHelper } from "../helpers/TimeHelperTS";
import { LoggerProvider } from "../LoggerTS";
import { RawUserBadge } from "../models/RawUserBadge";
import { UserBadge } from "../models/UserBadge";
import { UserInfoResponse } from "../models/UserController/UserInfoResponse";
import { FlagHandler } from "./FlagHandler";
import { ResultCacheWrapper } from "./ResultCacheWrapper";

const Logger = LoggerProvider.getInstance();
const FlagCache = FlagHandler.getCache();

export class UserHandler {
  private static cache: UserCache;

  static getCache(): UserCache {
    if (this.cache) return this.cache;
    this.cache = new UserCache();
    return this.cache;
  }
}

class UserCache extends ResultCacheWrapper<UserBadge[] | UserInfoResponse> {
  private _userDao: UserDao;

  constructor() {
    super({ name: "UserHandler" });
    this._userDao = new UserDao();
  }

  get size() {
    return super.getSize();
  }

  public unsetAll() {
    super.unsetAll();
  }

  async getBadges(id: string): Promise<UserBadge[]> {
    return (await this.getOrFetchValue({
      id,
      type: "Badges",
      fetchMethod: async id => {
        let badges: RawUserBadge[];
        try {
          badges = await this._userDao.getUserBadgesByID(id);
        } catch (e) {
          Logger.logError("UserHandler.getBadges", e as Error);
          return [];
        }

        badges.sort((a, b) => (a.value < b.value ? 1 : -1));
        return badges.slice(0, 5).map(badge => {
          return {
            name: badge.name,
            color: badge.color,
            icon: badge.icon,
            backgroundColor: badge.backgroundColor,
          };
        });
      },
      getTimeToCache: async () => await FlagCache.getIntFlag("time-to-cache-badges-internal"),
      cacheTimeFuzzRatio: 0.2,
      logFormatter: () => "",
    })) as UserBadge[];
  }

  async getInfo(username: string): Promise<UserInfoResponse> {
    return (await this.getOrFetchValue({
      id: username,
      type: "Info",
      fetchMethod: async username => {
        const result = await this._userDao.getUserDetails(username);

        let joinDate: string;
        if (result.joinDate) joinDate = TimeHelper.getJoinDateDisplay(result.joinDate);
        else joinDate = "OG";

        return <UserInfoResponse>{
          id: result._id.toString(),
          joinDate,
          badges: result.badges,
        };
      },
      getTimeToCache: async () => await FlagCache.getIntFlag("time-to-cache-badges-internal"),
      cacheTimeFuzzRatio: 0.2,
      logFormatter: () => "",
    })) as UserInfoResponse;
  }

  public getTimeToExpire(id: string) {
    return super.getTimeToExpire(id);
  }

  public unsetItem(id: string) {
    super.unsetItem(id);
  }
}
