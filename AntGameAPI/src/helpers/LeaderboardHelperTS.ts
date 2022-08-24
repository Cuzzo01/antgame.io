import { DailyChallengeHandler } from "../handler/DailyChallengeHandlerTS";
import { LeaderboardHandler } from "../handler/LeaderboardHandlerTS";
import { TimeHelper } from "./TimeHelperTS";

import { ChallengeLeaderboardData } from "../models/ChallengeLeaderboardData";
import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { LeaderboardEntry } from "../models/LeaderboardEntry";
import { FlagHandler } from "../handler/FlagHandler";
import { getChallengeByChallengeId } from "../dao/ChallengeDao";

const DailyChallengeCache = DailyChallengeHandler.getCache();
const LeaderboardCache = LeaderboardHandler.getCache();
const FlagCache = FlagHandler.getCache();

export const GenerateChallengeLeaderboardData = async (params: { challengeID: string }) => {
  const currentDaily = await DailyChallengeCache.getActiveDailyChallenge();
  const getCurrentDaily = params.challengeID.toLowerCase() === "daily";
  if (getCurrentDaily) params.challengeID = currentDaily.toString();

  const rawLeaderboardRows = await LeaderboardCache.getChallengeLeaderboard(params.challengeID);

  if (!rawLeaderboardRows || rawLeaderboardRows.length === 0) {
    return false;
  }

  const details = (await getChallengeByChallengeId(params.challengeID)) as FullChallengeConfig;
  const isDaily = details.dailyChallenge === true;

  const leaderboardRows: LeaderboardEntry[] = [];
  const isCurrentDaily = getCurrentDaily || currentDaily.equals(params.challengeID);
  for (let i = 0; i < rawLeaderboardRows.length; i++) {
    const entry = rawLeaderboardRows[i];
    const timeString =
      isDaily && !isCurrentDaily
        ? TimeHelper.getTimeStringForDailyChallenge(entry.runID)
        : TimeHelper.getGeneralizedTimeStringFromObjectID(entry.runID) + " ago";

    leaderboardRows.push({
      id: entry._id,
      rank: i + 1,
      username: entry.username,
      pb: entry.pb,
      age: timeString,
    });
  }

  let solutionImgPath: string;
  if (details.solutionImage) {
    if (await FlagCache.getBoolFlag("use-spaces-proxy")) {
      solutionImgPath = "https://antgame.io/assets/" + details.solutionImage;
    } else {
      solutionImgPath = "https://antgame.nyc3.digitaloceanspaces.com/" + details.solutionImage;
    }
  }

  let playerCount: number;
  if (await FlagCache.getBoolFlag("show-player-count-on-leaderboard"))
    playerCount = await LeaderboardCache.getChallengePlayerCount(params.challengeID);

  return { leaderboardRows, solutionImgPath, isDaily, playerCount } as ChallengeLeaderboardData;
};
