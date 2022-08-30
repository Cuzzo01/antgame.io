import { getUserBadgesByID } from "../dao/UserDao";
import { LoggerProvider } from "../LoggerTS";
import { RawUserBadge } from "../models/RawUserBadge";
import { UserBadge } from "../models/UserBadge";
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

class UserCache extends ResultCacheWrapper<UserBadge[]> {
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
    return await this.getOrFetchValue({
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
    });
  }

  public getTimeToExpire(id: string) {
    return super.getTimeToExpire(id);
  }

  public unsetItem(id: string) {
    super.unsetItem(id);
  }
}
