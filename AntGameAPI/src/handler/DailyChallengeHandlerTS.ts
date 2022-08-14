import { ResultCacheWrapper } from "./ResultCacheWrapperTS";

const { getDailyChallengesInReverseOrder } = require("../dao/ChallengeDao");

export class DailyChallengeHandler {
  private static cache: DailyChallengeCache;

  static getCache(): DailyChallengeCache {
    if (this.cache) return this.cache;
    this.cache = new DailyChallengeCache();
    return this.cache;
  }
}

class DailyChallengeCache extends ResultCacheWrapper<string> {
  constructor() {
    super({ name: "DailyChallengeHandler" });
  }

  async getActiveDailyChallenge(): Promise<string> {
    return await this.getOrFetchValue({
      id: "active",
      getTimeToCache: () => 3600,
      logFormatter: () => "",
      fetchMethod: async () => {
        return (await getDailyChallengesInReverseOrder({ limit: 1 }))[0]._id as string;
      },
    });
  }

  async getYesterdaysDailyChallenge(): Promise<string> {
    return await this.getOrFetchValue({
      id: "last",
      getTimeToCache: () => 3600,
      logFormatter: () => "",
      fetchMethod: async () => {
        return (await getDailyChallengesInReverseOrder({ limit: 1, skip: 1 }))[0]._id as string;
      },
    });
  }

  clearCache() {
    this.unsetAll();
  }
}
