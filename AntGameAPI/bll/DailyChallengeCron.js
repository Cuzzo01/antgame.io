const { updateConfigByID } = require("../dao/AdminDao");
const { ChallengeGenerator } = require("./ChallengeGenerator");
const Logger = require("../Logger");
const { scheduleJob } = require("node-schedule");
const DailyChallengeHandler = require("../handler/DailyChallengeHandler");
const FlagHandler = require("../handler/FlagHandler");
const { getDailyChallengesInReverseOrder } = require("../dao/ChallengeDao");
const { ChampionshipOrchestrator } = require("./ChampionshipOrchestrator");

const handleDailyChallengeChange = async () => {
  if ((await FlagHandler.getFlagValue("run-daily-challenge-cron")) === false) {
    LogMessage("skipping daily challenge cron swap");
    return;
  }
  LogMessage("starting daily challenge swap");
  const currentDailyChallenge = (await getDailyChallengesInReverseOrder({ limit: 1 }))[0];
  LogMessage(`current challenge is ${currentDailyChallenge._id}`);

  const newDailyChallengeID = await new ChallengeGenerator().generateDailyChallenge();
  LogMessage(`new challenge generated : challengeID: ${newDailyChallengeID}`);

  if (currentDailyChallenge) {
    await updateConfigByID(currentDailyChallenge._id, { active: false, order: 0 });
    LogMessage("set old map inactive");

    if (currentDailyChallenge.championshipID) {
      const championshipID = currentDailyChallenge.championshipID;
      const challengeID = currentDailyChallenge._id;
      try {
        await ChampionshipOrchestrator.awardPointsForChallenge({ championshipID, challengeID });
        LogMessage("awarded points for yesterdays challenge");
      } catch (e) {
        LogMessage(`Could not award points for challenge : ${e}`);
      }
    }
  } else {
    LogMessage("skipping setting old map inactive");
  }
  if (newDailyChallengeID) {
    if (await FlagHandler.getFlagValue("should-bind-daily-to-championship")) {
      let currentChampionship = await ChampionshipOrchestrator.getCurrentDailyChampionship();
      if (currentChampionship === null) {
        currentChampionship = await ChampionshipOrchestrator.generateDailyChampionship();
      }
      await ChampionshipOrchestrator.addConfigToChampionship(
        currentChampionship,
        newDailyChallengeID
      );
      LogMessage("bound new config to this current championship");
    }

    await updateConfigByID(newDailyChallengeID, { active: true });
    DailyChallengeHandler.clearCache();
    LogMessage("set new map active");
  } else {
    LogMessage("could not set new map active due to no ID");
  }
};

const initializeScheduledTask = () => {
  if (process.env.environment !== "LOCAL") {
    const job = scheduleJob({ hour: 12, minute: 0 }, handleDailyChallengeChange);
    LogMessage(`cron initialized, next run at ${job.nextInvocation()}`);
  } else {
    console.log("Skipping initializing crons");
  }
};
module.exports = { handleDailyChallengeChange, initializeScheduledTask };

const LogMessage = message => {
  Logger.log({
    message: "Daily challenge cron",
    cronMessage: message,
  });
};
