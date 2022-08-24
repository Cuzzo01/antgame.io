import { ObjectId } from "mongodb";
import { getDailyChallengesInReverseOrder } from "../dao/ChallengeDao";
import { ResultCacheWrapper } from "./ResultCacheWrapperTS";

export class DailyChallengeHandler {
  private static cache: DailyChallengeCache;

  static getCache(): DailyChallengeCache {
    if (this.cache) return this.cache;
    this.cache = new DailyChallengeCache();
    return this.cache;
  }
}

class DailyChallengeCache extends ResultCacheWrapper<ObjectId> {
  constructor() {
    super({ name: "DailyChallengeHandler" });
  }

  async getActiveDailyChallenge() {
    return await this.getOrFetchValue({
      id: "active",
      getTimeToCache: () => 3600,
      logFormatter: () => "",
      fetchMethod: async () => {
        return (await getDailyChallengesInReverseOrder({ limit: 1 }))[0]._id;
      },
    });
  }

  async getYesterdaysDailyChallenge() {
    return await this.getOrFetchValue({
      id: "last",
      getTimeToCache: () => 3600,
      logFormatter: () => "",
      fetchMethod: async () => {
        return (await getDailyChallengesInReverseOrder({ limit: 1, skip: 1 }))[0]._id;
      },
    });
  }

  clearCache() {
    this.unsetAll();
  }
}
