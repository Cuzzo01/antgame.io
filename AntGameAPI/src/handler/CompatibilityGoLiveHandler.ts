import { CompatibilityGoLiveDao } from "../dao/CompatibilityGoLiveDao";
import { GoLiveDateEntity } from "../dao/entities/GoLiveDateEntity";
import { ResultCacheWrapper } from "./ResultCacheWrapper";

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
      getTimeToCache: () => 3600,
      logFormatter: () => "",
      fetchMethod: async () => {
        return await this.goLiveDateDao.getGoLiveDates();
      },
    });
  }
}
