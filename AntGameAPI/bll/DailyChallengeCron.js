const { updateConfigByID } = require("../dao/AdminDao");
const { getMostRecentDailyChallenge } = require("../dao/ChallengeDao");
const { ChallengeGenerator } = require("./ChallengeGenerator");
const Logger = require("../Logger");
const { RecurrenceRule, scheduleJob } = require("node-schedule");

const handleDailyChallengeChange = async () => {
  Logger.log({ message: "Daily challenge cron", cronMessage: "starting daily challenge swap" });
  const currentDailyChallenge = await getMostRecentDailyChallenge();
  Logger.log({
    message: "Daily challenge cron",
    cronMessage: `current challenge is ${currentDailyChallenge._id}`,
  });

  const newDailyChallengeID = await new ChallengeGenerator().generateDailyChallenge();
  Logger.log({
    message: "Daily challenge cron",
    cronMessage: `new challenge generated : challengeID: ${newDailyChallengeID}`,
  });

  if (currentDailyChallenge) {
    await updateConfigByID(currentDailyChallenge._id, { active: false, order: 0 });
    Logger.log({ message: "Daily challenge cron", cronMessage: "set old map inactive" });
  } else {
    Logger.log({
      message: "Daily challenge cron",
      cronMessage: "skipping setting old map inactive",
    });
  }
  if (newDailyChallengeID) {
    await updateConfigByID(newDailyChallengeID, { active: true });
    Logger.log({ message: "Daily challenge cron", cronMessage: "set new map active" });
  } else {
    Logger.log({
      message: "Daily challenge cron",
      cronMessage: "could not set new map active due to no ID",
    });
  }
};

const initializeScheduledTask = () => {
  if (process.env.environment) {
    const job = scheduleJob({ hour: 12, minute: 0 }, handleDailyChallengeChange);
    Logger.log({
      message: "Daily cron",
      cronMessage: `cron initialized, next run at ${job.nextInvocation()}`,
    });
  } else {
    console.log("Skipping initializing crons");
  }
};
module.exports = { handleDailyChallengeChange, initializeScheduledTask };
