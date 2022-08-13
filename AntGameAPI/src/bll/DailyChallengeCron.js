const { updateConfigByID } = require("../dao/AdminDao");
const { ChallengeGenerator } = require("./ChallengeGenerator");
const Logger = require("../Logger");
const DailyChallengeHandler = require("../handler/DailyChallengeHandler");
const ActiveChallengesHandler = require("../handler/ActiveChallengesHandler");
const FlagHandler = require("../handler/FlagHandler");
const {
  getDailyChallengesInReverseOrder,
  getRunDataByRunId,
  getRecordByChallenge,
} = require("../dao/ChallengeDao");
const { ChampionshipOrchestrator } = require("./ChampionshipOrchestrator");

const handleDailyChallengeChange = async () => {
  try {
    if ((await FlagHandler.getFlagValue("run-daily-challenge-cron")) === false) {
      Logger.logCronMessage("skipping daily challenge cron swap");
      return;
    }
    Logger.logCronMessage("starting daily challenge swap");
    const currentDailyChallenge = (await getDailyChallengesInReverseOrder({ limit: 1 }))[0];
    Logger.logCronMessage(`current challenge is ${currentDailyChallenge._id}`);

    const newDailyChallengeID = await new ChallengeGenerator().generateDailyChallenge();
    Logger.logCronMessage(`new challenge generated : challengeID: ${newDailyChallengeID}`);

    let shouldAwardBadges = false;
    if (newDailyChallengeID) {
      await updateConfigByID(newDailyChallengeID, { active: true });
      DailyChallengeHandler.clearCache();
      ActiveChallengesHandler.unsetItem();
      Logger.logCronMessage("set new map active");

      if (await FlagHandler.getFlagValue("should-bind-daily-to-championship")) {
        let currentChampionship = await ChampionshipOrchestrator.getCurrentDailyChampionship();
        if (currentChampionship === null) {
          currentChampionship = await ChampionshipOrchestrator.generateDailyChampionship();
          shouldAwardBadges = true;
          Logger.logCronMessage("Generated new championship");
        }
        await ChampionshipOrchestrator.addConfigToChampionship(
          currentChampionship,
          newDailyChallengeID
        );
        Logger.logCronMessage("bound new config to the current championship");
      }
    }

    if (currentDailyChallenge) {
      const challengeID = currentDailyChallenge._id;
      await updateConfigByID(challengeID, { active: false, order: 0 });
      Logger.logCronMessage("set old map inactive");

      if (currentDailyChallenge.championshipID) {
        const championshipID = currentDailyChallenge.championshipID;
        try {
          await ChampionshipOrchestrator.awardPointsForChallenge({ championshipID, challengeID });
          Logger.logCronMessage("awarded points for yesterdays challenge");
        } catch (e) {
          Logger.logCronMessage(`Could not award points for challenge : ${e}`);
        }
      }

      try {
        const wrRun = await getRecordByChallenge(challengeID);
        const wrRunData = await getRunDataByRunId(wrRun.runId);
        const solutionImagePath = wrRunData.solutionImage;
        await updateConfigByID(challengeID, { solutionImage: solutionImagePath });
        Logger.logCronMessage(`Generated and set solution image`);
      } catch (e) {
        Logger.logCronMessage(`Could not generate solution image : ${e}`);
      }
    } else {
      Logger.logCronMessage("skipping setting old map inactive");
    }

    if (shouldAwardBadges) {
      const lastChampionship = await ChampionshipOrchestrator.getLastMonthsChampionshipID();
      if (lastChampionship)
        await ChampionshipOrchestrator.awardBadgesForChampionship({
          championshipID: lastChampionship,
        });
      Logger.logCronMessage("Awarded badges for last championship");
    }
  } catch (err) {
    Logger.logError("DailyChallengeCron", err);
  }
};
module.exports = { handleDailyChallengeChange };
