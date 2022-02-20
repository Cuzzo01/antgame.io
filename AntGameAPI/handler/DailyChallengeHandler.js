const { getDailyChallengesInReverseOrder } = require("../dao/ChallengeDao");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");

class DailyChallengeHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "DailyChallengeHandler" });
  }

  async getActiveDailyChallenge() {
    return await this.getOrFetchValue({
      id: "",
      getTimeToCache: () => 3600,
      logFormatter: () => "",
      fetchMethod: async () => {
        return (await getDailyChallengesInReverseOrder({ limit: 1 }))[0]._id;
      },
    });
  }

  clearCache() {
    super.unsetAll();
  }
}
const SingletonInstance = new DailyChallengeHandler();
module.exports = SingletonInstance;
