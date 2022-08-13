const DailyChallengeHandler = require("../handler/DailyChallengeHandler");
const LeaderboardHandler = require("../handler/LeaderboardHandler");
const ChallengeDao = require("../dao/ChallengeDao");
const FlagHandler = require("../handler/FlagHandler");
const {
  getTimeStringForDailyChallenge,
  getGeneralizedTimeStringFromObjectID,
} = require("./TimeHelper");

const GenerateChallengeLeaderboardData = async ({ challengeID }) => {
  const currentDaily = await DailyChallengeHandler.getActiveDailyChallenge();
  let getCurrentDaily = challengeID.toLowerCase() === "daily";
  if (getCurrentDaily) challengeID = currentDaily;

  const rawLeaderboardRows = await LeaderboardHandler.getChallengeLeaderboard(challengeID);

  if (!rawLeaderboardRows || rawLeaderboardRows.length === 0) {
    return false;
  }

  const details = await ChallengeDao.getChallengeByChallengeId(challengeID);
  const isDaily = details.dailyChallenge === true;

  let leaderboardRows = [];
  let isCurrentDaily = getCurrentDaily || currentDaily.equals(challengeID);
  for (let i = 0; i < rawLeaderboardRows.length; i++) {
    const entry = rawLeaderboardRows[i];
    const timeString =
      isDaily && !isCurrentDaily
        ? getTimeStringForDailyChallenge(entry.runID)
        : getGeneralizedTimeStringFromObjectID(entry.runID) + " ago";

    leaderboardRows.push({
      id: entry._id,
      rank: i + 1,
      username: entry.username,
      pb: entry.pb,
      age: timeString,
    });
  }

  let solutionImgPath;
  if (details.solutionImage) {
    if (await FlagHandler.getFlagValue("use-spaces-proxy")) {
      solutionImgPath = "https://antgame.io/assets/" + details.solutionImage;
    } else {
      solutionImgPath = "https://antgame.nyc3.digitaloceanspaces.com/" + details.solutionImage;
    }
  }

  let playerCount;
  if (await FlagHandler.getFlagValue("show-player-count-on-leaderboard"))
    playerCount = await LeaderboardHandler.getChallengePlayerCount(challengeID);

  return { leaderboardRows, solutionImgPath, isDaily, playerCount };
};
module.exports = { GenerateChallengeLeaderboardData };
