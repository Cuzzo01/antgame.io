const {
  getDailyChallengesInReverseOrder,
  getChallengeByChallengeId,
} = require("../dao/ChallengeDao");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");
const MapHandler = require("./MapHandler");
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

  async getDailyChallengeThumbnail() {
    return await this.getOrFetchValue({
      id: "thumbnail",
      getTimeToCache: () => 3600,
      logFormatter: () => "",
      fetchMethod: async () => {
        const dailyChallenge = await this.getActiveDailyChallenge();
        const configDetails = await getChallengeByChallengeId(dailyChallenge);
        const mapData = await MapHandler.getMapData({ mapID: configDetails.mapID });

        return `https://antgame.io/assets/${mapData.thumbnailPath}`;
      },
    });
  }

  clearCache() {
    this.unsetAll();
  }
}
const SingletonInstance = new DailyChallengeHandler();
module.exports = SingletonInstance;
