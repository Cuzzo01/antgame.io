import { scheduleJob } from "node-schedule";
import { removeAnonAndTagLessRunsOlderThan7Days } from "../dao/DBCleanUp";
import { LoggerProvider } from "../LoggerTS";
import { RefreshActiveChallengeCache } from "./ActiveChallengeRefresher";
import { handleDailyChallengeChange } from "./DailyChallengeCronTS";

const Logger = LoggerProvider.getInstance();

export const initializeScheduledTasks = () => {
  if (process.env.environment !== "LOCAL") {
    const dailyChallengeJob = scheduleJob({ hour: 12, minute: 0 }, handleDailyChallengeChange);
    Logger.logCronMessage(
      `cron initialized, next run at ${dailyChallengeJob.nextInvocation().toISOString()}`
    );
    const dbCleanupJob = scheduleJob(
      { hour: 0, minute: 0 },
      removeAnonAndTagLessRunsOlderThan7Days
    );
    Logger.info({
      source: "removeAnonAndTagLessRunsOlderThan7Days",
      infoText: `cron initialized, next run at ${dbCleanupJob.nextInvocation().toISOString()}`,
    });
    const activeChallengeJob = scheduleJob("*/10 * * * *", RefreshActiveChallengeCache);
    Logger.info({
      source: "activeChallengeJob",
      infoText: `cron initialized, next run at ${activeChallengeJob
        .nextInvocation()
        .toISOString()}`,
    });
  } else {
    console.log("Skipping initializing crons");
  }
};
