const { getChallengeByChallengeId } = require("../dao/ChallengeDao");
const {
  getLeaderboardByChampionshipID,
  getChampionshipDetailsFromDB,
  getLastPointsAwarded,
} = require("../dao/ChampionshipDao");
const { getLeaderboardByChallengeId } = require("../dao/UserDao");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");

class LeaderboardHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "LeaderboardHandler" });
  }

  async getChallengeLeaderboard(id) {
    return await this.getOrFetchValue({
      id,
      type: "Challenge",
      fetchMethod: async id => {
        return await getLeaderboardByChallengeId(id, 15);
      },
      getTimeToCache: () => 3600,
    });
  }

  async getChampionshipLeaderboardData(id) {
    return await this.getOrFetchValue({
      id,
      name: "Championship",
      fetchMethod: async id => {
        const leaderboard = getLeaderboardByChampionshipID(id, 50);
        const data = getChampionshipDetailsFromDB(id);
        const toReturn = {
          leaderboard: await leaderboard,
          pointMap: (await data).pointsMap,
        };

        const lastPointsAwardedID = await getLastPointsAwarded(id);
        if (lastPointsAwardedID) {
          const lastPointsAwardedChallenge = await getChallengeByChallengeId(
            lastPointsAwardedID.toString()
          );
          toReturn.lastPointsAwarded = lastPointsAwardedChallenge.pointsAwarded;
        }

        return toReturn;
      },
      getTimeToCache: () => 3600,
    });
  }
}
const SingletonInstance = new LeaderboardHandler();
module.exports = SingletonInstance;
