import { ActiveChallengesHandler } from "../handler/ActiveChallengesHandler";
import { LeaderboardHandler } from "../handler/LeaderboardHandler";
import { LoggerProvider } from "../LoggerTS";

const Logger = LoggerProvider.getInstance();
const ActiveChallengesCache = ActiveChallengesHandler.getCache();
const LeaderboardCache = LeaderboardHandler.getCache();

export const RefreshActiveChallengeCache = async () => {
  const startTime = new Date();
  const { challenges } = await ActiveChallengesCache.getActiveChallenges();

  const promises = [];
  challenges.forEach(({ id }) => {
    promises.push(LeaderboardCache.getRawChallengeLeaderboard(id));
  });

  await Promise.all(promises);
  const endTime = new Date();
  const elasped = endTime.getTime() - startTime.getTime();
  Logger.info(
    "RefreshActiveChallengeCache",
    `Refreshed all active challenge leaderboards, it took ${elasped}ms`
  );
};
