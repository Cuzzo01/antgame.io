import { DailyChallengeHandler } from "../handler/DailyChallengeHandler";
import { LeaderboardHandler } from "../handler/LeaderboardHandler";
import { TimeHelper } from "./TimeHelperTS";

import { ChallengeLeaderboardData } from "../models/ChallengeLeaderboardData";
import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { LeaderboardEntry } from "../models/LeaderboardEntry";
import { FlagHandler } from "../handler/FlagHandler";
import { getChallengeByChallengeId } from "../dao/ChallengeDao";
import { ObjectIDToNameHandler } from "../handler/ObjectIDToNameHandler";

const DailyChallengeCache = DailyChallengeHandler.getCache();
const LeaderboardCache = LeaderboardHandler.getCache();
const FlagCache = FlagHandler.getCache();
const ObjectIDToNameCache = ObjectIDToNameHandler.getCache();

export const GenerateChallengeLeaderboardData = async (challengeID: string, page = 1) => {
  const currentDaily = await DailyChallengeCache.getActiveDailyChallenge();
  const getCurrentDaily = challengeID.toLowerCase() === "daily";
  if (getCurrentDaily) challengeID = currentDaily.toString();

  let rawLeaderboardRows = await LeaderboardCache.getRawChallengeLeaderboard(challengeID);
  const pageLength = await FlagCache.getIntFlag("leaderboard-length");
  const startIndex = pageLength * (page - 1);
  rawLeaderboardRows = rawLeaderboardRows.slice(startIndex, startIndex + pageLength);

  if (!rawLeaderboardRows || rawLeaderboardRows.length === 0) {
    return false;
  }

  const details = (await getChallengeByChallengeId(challengeID)) as FullChallengeConfig;
  const isDaily = details.dailyChallenge === true;

  const leaderboardRows: LeaderboardEntry[] = [];
  const isCurrentDaily = getCurrentDaily || currentDaily.equals(challengeID);
  for (let i = 0; i < rawLeaderboardRows.length; i++) {
    const entry = rawLeaderboardRows[i];
    const timeString =
      isDaily && !isCurrentDaily
        ? TimeHelper.getTimeStringForDailyChallenge(entry.runID)
        : TimeHelper.getGeneralizedTimeStringFromObjectID(entry.runID) + " ago";

    const username = await ObjectIDToNameCache.getUsername(entry._id);
    leaderboardRows.push({
      id: entry._id.toString(),
      rank: startIndex + i + 1,
      username: username,
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
    playerCount = await LeaderboardCache.getChallengePlayerCount(challengeID);

  return { leaderboardRows, solutionImgPath, isDaily, playerCount } as ChallengeLeaderboardData;
};
