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
const { getTimeStringForDailyChallenge } = require("../helpers/TimeHelper");

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
      id: "championship",
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

        const leaderboardCopy = [...leaderboard];
        if (leaderboardCopy.length > 10) leaderboardCopy.length = 10;
        await populateLeaderboardNames(leaderboardCopy);

        return {
          id: championshipID,
          leaderboard: leaderboardCopy,
          name: await ObjectIDToNameHandler.getChampionshipName(championshipID),
        };
      },
      getTimeToCache: async () => await FlagHandler.getFlagValue("time-to-cache-active-challenges"),
    });
  };

  getYesterdaysDailyData = async () => {
    return await this.getOrFetchValue({
      id: "yesterdays_daily",
      fetchMethod: async () => {
        const yesterdaysDailyID = await DailyChallengeHandler.getYesterdaysDailyChallenge();
        const name = await ObjectIDToNameHandler.getChallengeName(yesterdaysDailyID);

        const leaderboard = await LeaderboardHandler.getChallengeLeaderboard(yesterdaysDailyID);
        const leaderboardCopy = [...leaderboard];
        if (leaderboardCopy.length > 10) leaderboardCopy.length = 10;

        let leaderboardData = [];
        for (let i = 0; i < leaderboardCopy.length; i++) {
          const entry = leaderboardCopy[i];
          const timeString = getTimeStringForDailyChallenge(entry.runID);

          leaderboardData.push({
            id: entry._id,
            rank: i + 1,
            username: entry.username,
            pb: entry.pb,
            age: timeString,
          });
        }

        return { name, id: yesterdaysDailyID, leaderboardData };
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
