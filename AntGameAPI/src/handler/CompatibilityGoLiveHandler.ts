import { CompatibilityGoLiveDao } from "../dao/CompatibilityGoLiveDao";
import { GoLiveDateEntity } from "../dao/entities/GoLiveDateEntity";
import { FlagHandler } from "./FlagHandler";
import { ResultCacheWrapper } from "./ResultCacheWrapper";

const FlagCache = FlagHandler.getCache();

export class CompatibilityGoLiveHandler {
  private static cache: CompatibilityGoLiveCache;

  static getCache(): CompatibilityGoLiveCache {
    if (this.cache) return this.cache;
    this.cache = new CompatibilityGoLiveCache();
    return this.cache;
  }
}

class CompatibilityGoLiveCache extends ResultCacheWrapper<GoLiveDateEntity[]> {
  private goLiveDateDao: CompatibilityGoLiveDao;

  constructor() {
    super({ name: "CompatibilityGoLiveCache" });
    this.goLiveDateDao = new CompatibilityGoLiveDao();
  }

  async getGoLiveDates() {
    return await this.getOrFetchValue({
      id: "",
      getTimeToCache: async () => await FlagCache.getIntFlag("cache-time.go-live-dates-sec"),
      logFormatter: () => "",
      fetchMethod: async () => {
        return await this.goLiveDateDao.getGoLiveDates();
      },
    });
  }

  public getTimeToExpire() {
    return super.getTimeToExpire("");
  }
}
