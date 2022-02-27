const { updateConfigByID } = require("../dao/AdminDao");
const { getChallengeByChallengeId, addChampionshipIDToConfig } = require("../dao/ChallengeDao");
const {
  updateUserPointsTotal,
  addUserToUserPoints,
  getChampionshipDetailsFromDB,
  addConfigIDToChampionship,
  createNewChampionship,
  getChampionshipIDByName,
  setLastAwarded,
  getLeaderboardByChampionshipID,
} = require("../dao/ChampionshipDao");
const { getLeaderboardByChallengeId, addBadgeToUser } = require("../dao/UserDao");
const { getShortMonthName } = require("../helpers/TimeHelper");
const LeaderboardHandler = require("../handler/LeaderboardHandler");
const { BadgeDataGenerator } = require("../helpers/BadgeDataGenerator");

const pointsMap = [
  { type: "rank", value: 1, points: 50 },
  { type: "rank", value: 2, points: 40 },
  { type: "rank", value: 3, points: 35 },
  { type: "rank", value: 4, points: 30 },
  { type: "rank", value: 5, points: 26 },
  { type: "rank", value: 6, points: 22 },
  { type: "rank", value: 7, points: 19 },
  { type: "rank", value: 8, points: 16 },
  { type: "rank", value: 9, points: 13 },
  { type: "rank", value: 10, points: 10 },
  { type: "percent", value: 0.1, points: 7 },
  { type: "percent", value: 0.25, points: 5 },
  { type: "percent", value: 0.5, points: 3 },
];

class ChampionshipOrchestrator {
  constructor() {}

  static async generateDailyChampionship() {
    const date = new Date();
    const name = `${getShortMonthName(date)} ${date.getFullYear()}`;
    return await createNewChampionship({ name, pointsMap });
  }

  static async getCurrentDailyChampionship() {
    const date = new Date();
    const name = `${getShortMonthName(date)} ${date.getFullYear()}`;
    return await getChampionshipIDByName(name);
  }

  static async addConfigToChampionship(championshipID, configID) {
    await addConfigIDToChampionship(championshipID, configID);
    await addChampionshipIDToConfig(configID, championshipID);
  }

  static async getLastMonthsChampionshipID() {
    const date = new Date();
    if (date.getMonth() === 0) {
      date.setMonth(11);
      date.setFullYear(date.getFullYear() - 1);
    } else date.setMonth(date.getMonth() - 1);
    const name = `${getShortMonthName(date)} ${date.getFullYear()}`;
    return await getChampionshipIDByName(name);
  }

  static async awardPointsForChallenge({ championshipID, challengeID }) {
    const challengeConfig = await getChallengeByChallengeId(challengeID);
    const championshipDetails = await getChampionshipDetailsFromDB(championshipID);
    if (challengeConfig.active !== false) {
      throw "Challenge is active";
    }
    if (!challengeConfig.championshipID.equals(championshipID)) {
      throw "ChampionshipID mismatch";
    }
    if (challengeConfig.pointsAwarded !== undefined) {
      throw "Points already awarded";
    }

    const playerCount = await LeaderboardHandler.getChallengePlayerCount(challengeID);
    if (playerCount === 0) {
      throw "Challenge has no users";
    }

    const pointsMap = championshipDetails.pointsMap;
    let largestPercent = 0;
    let largestRank = 0;
    const percentCutoffs = [];
    pointsMap.forEach(pointObj => {
      if (pointObj.type === "percent")
        percentCutoffs.push({
          cutoff: Math.round(pointObj.value * playerCount),
          points: pointObj.points,
        });

      if (pointObj.type === "percent" && pointObj.value > largestPercent)
        largestPercent = pointObj.value;
      if (pointObj.type === "rank" && pointObj.value > largestRank) largestRank = pointObj.value;
    });
    const percentCount = Math.round(playerCount * largestPercent);
    const usersToGet = percentCount > largestRank ? percentCount : largestRank;

    const leaderboardEntries = await getLeaderboardByChallengeId(challengeConfig.id, usersToGet);

    let awardedPoints = [];
    let cutoffIndex = 0;
    for (let rank = 1; rank <= leaderboardEntries.length; rank++) {
      let entry = leaderboardEntries[rank - 1];
      if (rank <= largestRank) {
        const pointObj = pointsMap.find(obj => obj.type === "rank" && obj.value === rank);
        awardedPoints.push({ userID: entry._id, points: pointObj.points });
      } else {
        let currentCutoff = percentCutoffs[cutoffIndex];
        while (rank > currentCutoff.cutoff) {
          cutoffIndex++;
          currentCutoff = percentCutoffs[cutoffIndex];
        }
        awardedPoints.push({ userID: entry._id, points: currentCutoff.points });
      }
    }

    awardedPoints.forEach(async pointUpdateObject => {
      const alreadyHasPoints =
        championshipDetails.userPoints &&
        championshipDetails.userPoints.find(
          obj => obj.userID.toString() === pointUpdateObject.userID.toString()
        ) !== undefined;
      if (alreadyHasPoints)
        await updateUserPointsTotal(
          championshipDetails._id,
          pointUpdateObject.userID,
          pointUpdateObject.points
        );
      else
        await addUserToUserPoints(
          championshipDetails._id,
          pointUpdateObject.userID,
          pointUpdateObject.points
        );
    });

    LeaderboardHandler.unsetItem(championshipID);

    await setLastAwarded(championshipID, challengeConfig.id);
    await updateConfigByID(challengeConfig.id, { pointsAwarded: awardedPoints });
  }

  static async awardBadgesForChampionship({ championshipID }) {
    const leaderboard = await getLeaderboardByChampionshipID(championshipID, 50);
    const championshipName = (await getChampionshipDetailsFromDB(championshipID)).name;

    const badges = [];
    let lastPoints = 0;
    let tieCount = 0;
    for (let rank = 1; rank <= leaderboard.length; rank++) {
      const leaderboardEntry = leaderboard[rank - 1];

      let actualRank = rank;
      if (leaderboardEntry.points === lastPoints) {
        tieCount++;
        actualRank = rank - tieCount;
      } else {
        tieCount = 0;
      }
      lastPoints = leaderboardEntry.points;

      const userID = leaderboardEntry._id;
      if (actualRank === 1) {
        badges.push({
          userID: userID,
          badgeData: BadgeDataGenerator.getFirstPlaceBadge(championshipName),
        });
      } else if (actualRank === 2) {
        badges.push({
          userID: userID,
          badgeData: BadgeDataGenerator.getSecondPlaceBadge(championshipName),
        });
      } else if (actualRank === 3) {
        badges.push({
          userID: userID,
          badgeData: BadgeDataGenerator.getThirdPlaceBadge(championshipName),
        });
      } else if (actualRank <= 10) {
        badges.push({
          userID: userID,
          badgeData: BadgeDataGenerator.getTopTenBadge(rank, championshipName),
        });
      } else {
        badges.push({
          userID: userID,
          badgeData: BadgeDataGenerator.getTop50Badge(rank, championshipName),
        });
      }
    }

    badges.forEach(async badge => {
      await addBadgeToUser(badge.userID, badge.badgeData);
    });
  }
}
module.exports = { ChampionshipOrchestrator };
