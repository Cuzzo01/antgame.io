const { getChallengeByChallengeId } = require("../dao/ChallengeDao");
const { getChampionshipDetailsFromDB } = require("../dao/ChampionshipDao");
const { getUsernameByID } = require("../dao/UserDao");
const { ResultCacheWrapper } = require("./ResultCacheWrapper.js");

class ObjectIDToNameHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "ObjectIDToNameHandler" });
  }

  get timeToCache() {
    return Math.round(43200 * (1 - Math.random() * 0.1));
  }

  async getChallengeName(id) {
    return await this.getOrFetchValue({
      id,
      type: "Challenge",
      getTimeToCache: () => this.timeToCache,
      fetchMethod: async () => {
        const config = await getChallengeByChallengeId(id);
        return config.name;
      },
    });
  }

  async getUsername(id) {
    return await this.getOrFetchValue({
      id,
      type: "Username",
      getTimeToCache: () => this.timeToCache,
      fetchMethod: async () => {
        return await getUsernameByID(id);
      },
    });
  }

  async getChampionshipName(id) {
    return await this.getOrFetchValue({
      id,
      type: "Championship",
      getTimeToCache: () => this.timeToCache,
      fetchMethod: async () => {
        const championship = await getChampionshipDetailsFromDB(id);
        return championship.name;
      },
    });
  }
}
const SingletonInstance = new ObjectIDToNameHandler();
module.exports = SingletonInstance;
