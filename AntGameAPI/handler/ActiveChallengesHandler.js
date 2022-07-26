const { getActiveChallenges, getRecordsByChallengeList } = require("../dao/ChallengeDao");
const FlagHandler = require("./FlagHandler");
const DailyChallengeHandler = require("./DailyChallengeHandler");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");

class ActiveChallengesHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "ActiveChallengesHandler" });
  }

  getActiveChallenges = async () => {
    return await this.getOrFetchValue({
      id: "",
      fetchMethod: async () => {
        const activeChallenges = await getActiveChallenges();

        let challengeIDList = [];
        activeChallenges.forEach(challenge => {
          challengeIDList.push(challenge.id);
        });

        const dailyIndex = activeChallenges.findIndex(c => c.dailyChallenge);
        activeChallenges[dailyIndex].thumbnailURL =
          await DailyChallengeHandler.getDailyChallengeThumbnail();

        const records = await getRecordsByChallengeList(challengeIDList);
        return { challenges: activeChallenges, worldRecords: records };
      },
      getTimeToCache: async () => await FlagHandler.getFlagValue("time-to-cache-active-challenges"),
    });
  };

  unsetItem() {
    super.unsetItem("");
  }
}
const SingletonInstance = new ActiveChallengesHandler();
module.exports = SingletonInstance;
