const { scheduleJob } = require("node-schedule");
const { handleDailyChallengeChange } = require("./DailyChallengeCron");
const Logger = require("../Logger");
const { removeAnonAndTagLessRunsOlderThan7Days } = require("../dao/DBCleanUp");

const initializeScheduledTasks = () => {
  if (process.env.environment !== "LOCAL") {
    const dailyChallengeJob = scheduleJob({ hour: 12, minute: 0 }, handleDailyChallengeChange);
    Logger.logCronMessage(`cron initialized, next run at ${dailyChallengeJob.nextInvocation()}`);
    const dbCleanupJob = scheduleJob(
      { hour: 0, minute: 0 },
      removeAnonAndTagLessRunsOlderThan7Days
    );
    Logger.logDBCleanupMessage(`cron initialized, next run at ${dbCleanupJob.nextInvocation()}`);
  } else {
    console.log("Skipping initializing crons");
  }
};

module.exports = { initializeScheduledTasks };
