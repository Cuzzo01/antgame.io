const {
  getActiveChallenges,
  getRecordsByChallengeList,
  getChallengeByChallengeId,
} = require("../dao/ChallengeDao");
const FlagHandler = require("./FlagHandler");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");
const LeaderboardHandler = require("../handler/LeaderboardHandler");
const DailyChallengeHandler = require("../handler/DailyChallengeHandler");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");

class ActiveChallengesHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "ActiveChallengesHandler" });
  }

  getActiveChallenges = async () => {
    return await this.getOrFetchValue({
      id: "activeChallenges",
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

  getChampionshipData = async () => {
    return await this.getOrFetchValue({
      id: "",
      fetchMethod: async () => {
        const todaysChallengeID = await DailyChallengeHandler.getActiveDailyChallenge();
        const todaysChallengeDetails = await getChallengeByChallengeId(todaysChallengeID);

        let championshipID = todaysChallengeDetails.championshipID;
        let leaderboard = await LeaderboardHandler.getRawChampionshipLeaderboard(championshipID);

        if (!leaderboard.length) {
          const yesterdaysChallengeID = await DailyChallengeHandler.getYesterdaysDailyChallenge();
          const yesterdaysChallengeDetails = await getChallengeByChallengeId(yesterdaysChallengeID);
          championshipID = yesterdaysChallengeDetails.championshipID;

          leaderboard = await LeaderboardHandler.getRawChampionshipLeaderboard(championshipID);
        }

        if (leaderboard.length > 10) leaderboard.length = 10;
        await populateLeaderboardNames(leaderboard);

        return {
          id: championshipID,
          leaderboard,
          name: await ObjectIDToNameHandler.getChampionshipName(championshipID),
        };
      },
      getTimeToCache: async () => await FlagHandler.getFlagValue("time-to-cache-active-challenges"),
    });
  };

  unsetItem() {
    super.unsetAll();
  }
}
const SingletonInstance = new ActiveChallengesHandler();
module.exports = SingletonInstance;

const populateLeaderboardNames = async leaderboard => {
  for (let i = 0; i < leaderboard.length; i++) {
    const entry = leaderboard[i];
    const username = await ObjectIDToNameHandler.getUsername(entry._id);
    entry.username = username;
  }
};
