const { updateConfigByID } = require("../dao/AdminDao");
const { getMostRecentDailyChallenge } = require("../dao/ChallengeDao");
const { ChallengeGenerator } = require("./ChallengeGenerator");
const Logger = require("../Logger");
const { RecurrenceRule, scheduleJob } = require("node-schedule");

const handleDailyChallengeChange = async () => {
  Logger.log({ message: "Daily cron status", status: "starting daily challenge swap" });
  const currentDailyChallenge = await getMostRecentDailyChallenge();

  const newDailyChallengeID = await new ChallengeGenerator().generateDailyChallenge();
  Logger.log({
    message: "Daily cron status",
    status: `new challenge generated : challengeID: ${newDailyChallengeID}`,
  });

  await updateConfigByID(currentDailyChallenge._id, { active: false, order: 0 });
  Logger.log({ message: "Daily cron status", status: "set old map inactive" });
  await updateConfigByID(newDailyChallengeID, { active: true });
  Logger.log({ message: "Daily cron status", status: "set new map active" });
};

const initializeScheduledTask = () => {
  const rule = new RecurrenceRule();
  rule.minute = 0;
  rule.hour = 12;
  rule.tz = "US/Central";

  const job = scheduleJob(rule, handleDailyChallengeChange);
  Logger.log({
    message: "Daily cron status",
    status: `cron initialized, next run at ${job.nextInvocation()}`,
  });
};
module.exports = { handleDailyChallengeChange, initializeScheduledTask };
