const { getActiveChallenges, getRecordsByChallengeList } = require("../dao/ChallengeDao");
const FlagHandler = require("./FlagHandler");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");

class ActiveChallengeHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "ActiveChallengeHandler" });
  }

  getActiveChallenges = async () => {
    return await this.getOrFetchValue({
      id: "",
      type: "CurrentActive",
      fetchMethod: async () => {
        const activeChallenges = await getActiveChallenges();

        let challengeIDList = [];
        activeChallenges.forEach(challenge => {
          challengeIDList.push(challenge.id);
        });

        const records = await getRecordsByChallengeList(challengeIDList);
        return { challenges: activeChallenges, worldRecords: records };
      },
      getTimeToCache: async () => await FlagHandler.getFlagValue("time-to-cache-active-challenges"),
    });
  };

  unsetItem() {
    this.unsetItem("");
  }
}
const SingletonInstance = new ActiveChallengeHandler();
module.exports = SingletonInstance;
