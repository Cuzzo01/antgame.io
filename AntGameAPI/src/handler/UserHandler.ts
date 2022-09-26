import { ObjectId } from "mongodb";
import { getUserBadgesByID, getUserDetailsByUsername } from "../dao/UserDao";
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
  constructor() {
    super({ name: "UserHandler" });
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
          badges = (await getUserBadgesByID(id)) as RawUserBadge[];
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
      getTimeToCache: async () => {
        const maxTimeToCache = await FlagCache.getIntFlag("time-to-cache-badges-internal");
        const cacheTime = Math.round(maxTimeToCache * (1 - Math.random() * 0.2));
        return cacheTime;
      },
      logFormatter: () => "",
    })) as UserBadge[];
  }

  async getInfo(username: string): Promise<UserInfoResponse> {
    return (await this.getOrFetchValue({
      id: username,
      type: "Info",
      fetchMethod: async username => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const result = (await getUserDetailsByUsername(username)) as {
          _id: ObjectId;
          username: string;
          joinDate: Date | false;
          badges: UserBadge[];
        };

        let joinDate: string;
        if (result.joinDate) joinDate = TimeHelper.getJoinDateDisplay(result.joinDate);
        else joinDate = "OG";

        return <UserInfoResponse>{
          id: result._id.toString(),
          joinDate,
          badges: result.badges,
        };
      },
      getTimeToCache: async () => {
        const maxTimeToCache = await FlagCache.getIntFlag("cache-time.user-info");
        const cacheTime = Math.round(maxTimeToCache * (1 - Math.random() * 0.2));
        return cacheTime;
      },
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
