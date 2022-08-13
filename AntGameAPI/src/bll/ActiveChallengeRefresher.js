const ActiveChallengeHandler = require("../handler/ActiveChallengesHandler");
const LeaderboardHandler = require("../handler/LeaderboardHandler");
const Logger = require("../Logger");

const RefreshActiveChallengeCache = async () => {
  const startTime = new Date();
  const { challenges } = await ActiveChallengeHandler.getActiveChallenges();

  const promises = [];
  challenges.forEach(({ id }) => {
    promises.push(LeaderboardHandler.getRawChallengeLeaderboard(id));
  });

  await Promise.all(promises);
  const endTime = new Date();
  Logger.info({
    source: "RefreshActiveChallengeCache",
    infoText: `Refreshed all active challenge leaderboards, it took ${endTime - startTime}ms`,
  });
};
module.exports = { RefreshActiveChallengeCache };
