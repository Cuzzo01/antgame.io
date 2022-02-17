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

  unsetItem(id) {
    super.unsetItem(id);
    const rawID = `${id}-raw`;
    if (super.itemIsSet(rawID)) super.unsetItem(rawID);
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

  async getRawChampionshipLeaderboard(id) {
    return await this.getOrFetchValue({
      id: `${id}-raw`,
      type: "Raw championship",
      fetchMethod: async () => {
        return await getLeaderboardByChampionshipID(id);
      },
      getTimeToCache: () => 3600,
    });
  }

  async getRawChallengeLeaderboard(id) {
    return await this.getOrFetchValue({
      id: `${id}-raw`,
      type: "Raw challenge",
      fetchMethod: async () => {
        return await getLeaderboardByChallengeId(id);
      },
      getTimeToCache: () => 3600,
    });
  }

  async getChallengeRankByUserId(challengeID, userID) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    const rank = 1 + leaderboardArr.findIndex(entry => entry._id.equals(userID));
    return rank;
  }

  async getLeaderboardEntryByRank(challengeID, rank) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    const entry = leaderboardArr[rank - 1];
    return entry;
  }

  async getLeaderboardEntryByUserID(challengeID, userID) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    const entry = leaderboardArr.find(entry => entry._id.equals(userID));
    return entry;
  }
}
const SingletonInstance = new LeaderboardHandler();
module.exports = SingletonInstance;
