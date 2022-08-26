import { updateConfigByID } from "../dao/AdminDao";
import {
  getDailyChallengesInReverseOrder,
  getRecordByChallenge,
  getRunDataByRunId,
} from "../dao/ChallengeDao";
import { ActiveChallengesHandler } from "../handler/ActiveChallengesHandler";
import { DailyChallengeHandler } from "../handler/DailyChallengeHandler";
import { LoggerProvider } from "../LoggerTS";
import { ChallengeGenerator } from "./ChallengeGenerator";
import { ChampionshipOrchestrator } from "./ChampionshipOrchestrator";
import { FlagHandler } from "../handler/FlagHandler";

import { RunData } from "../models/RunData";
import { ObjectId } from "mongodb";

const Logger = LoggerProvider.getInstance();
const ActiveChallengesCache = ActiveChallengesHandler.getCache();
const DailyChallengeCache = DailyChallengeHandler.getCache();
const FlagCache = FlagHandler.getCache();

export const handleDailyChallengeChange = async () => {
  try {
    if (!(await FlagCache.getBoolFlag("run-daily-challenge-cron"))) {
      Logger.logCronMessage("skipping daily challenge cron swap");
      return;
    }
    Logger.logCronMessage("starting daily challenge swap");
    const currentDailyChallengeList = (await getDailyChallengesInReverseOrder({ limit: 1 })) as {
      _id: ObjectId;
      name: string;
      championshipID: string;
    }[];
    const currentDailyChallenge = currentDailyChallengeList[0];
    Logger.logCronMessage(`current challenge is ${currentDailyChallenge._id.toString()}`);

    const newDailyChallengeID = await new ChallengeGenerator().generateDailyChallenge();
    let shouldAwardBadges = false;
    if (newDailyChallengeID) {
      Logger.logCronMessage(
        `new challenge generated : challengeID: ${newDailyChallengeID.toString()}`
      );
      await updateConfigByID(newDailyChallengeID, { active: true });
      DailyChallengeCache.clearCache();
      ActiveChallengesCache.unsetItem();
      Logger.logCronMessage("set new map active");

      if (await FlagCache.getBoolFlag("should-bind-daily-to-championship")) {
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
    } else {
      Logger.logCronMessage("Failed to generate new daily challenge");
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
          Logger.logError("DailyChallengeCron", e as Error);
          Logger.logCronMessage(`Could not award points for challenge : ${e as string}`);
        }
      }

      try {
        const wrRun = await getRecordByChallenge(challengeID);
        const wrRunData = (await getRunDataByRunId(wrRun.runId)) as RunData;
        if (wrRunData?.solutionImage) {
          const solutionImagePath = wrRunData.solutionImage;
          await updateConfigByID(challengeID, { solutionImage: solutionImagePath });
          Logger.logCronMessage(`Set solution image path`);
        } else {
          Logger.logCronMessage("WR run had no solution image");
        }
      } catch (e) {
        Logger.logError("DailyChallengeCron", e as Error);
        Logger.logCronMessage(`Could not set solution image : ${e as string}`);
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
    Logger.logError("DailyChallengeCron", err as Error);
  }
};
