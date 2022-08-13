const { getDailyChallengesInReverseOrder } = require("../dao/ChallengeDao");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");
class DailyChallengeHandler extends ResultCacheWrapper {
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
const SingletonInstance = new DailyChallengeHandler();
module.exports = SingletonInstance;
