import { Request, Response } from "express";
import { ActiveChallengesHandler } from "../handler/ActiveChallengesHandlerTS";
import { LeaderboardHandler } from "../handler/LeaderboardHandlerTS";
import { LoggerProvider } from "../LoggerTS";
import { GenerateRecordImageRequest } from "../models/GenerateRecordImageRequest";

// const Logger = require("../Logger");
// const ActiveChallengesHandler = require("../handler/ActiveChallengesHandler");
// const LeaderboardHandler = require("../handler/LeaderboardHandler");
const { GenerateSolutionImage } = require("../bll/RecordImageGenerator");
const { addSolutionImageToRun } = require("../dao/ChallengeDao");

const Logger = LoggerProvider.getInstance();
const ActiveChallengesCache = ActiveChallengesHandler.getCache();
const LeaderboardCache = LeaderboardHandler.getCache();

export class ServiceController {
  static healthCheck(_: Request, res: Response) {
    try {
      res.send("OK");
    } catch (e) {
      Logger.logError("ServiceController.healthCheck", e as Error);
      res.sendStatus(500);
    }
  }

  static dumpActiveChallengesCache(_: Request, res: Response) {
    try {
      ActiveChallengesCache.unsetItem();

      res.sendStatus(200);
    } catch (e) {
      Logger.logError("ServiceController.dumpActiveChallengesCache", e);
      res.sendStatus(500);
    }
  }

  static dumpLeaderboardCache(req: Request, res: Response) {
    try {
      const challengeID = req.params.id;

      if (!challengeID) {
        res.status(400);
        res.send("Must specify challengeID");
        return;
      }

      LeaderboardCache.unsetItem(challengeID);

      res.sendStatus(200);
    } catch (e) {
      Logger.logError("ServiceController.dumpActiveChallengesCache", e);
      res.sendStatus(500);
    }
  }

  static async generateRecordImage(req: Request, res: Response) {
    try {
      const request = req.body as GenerateRecordImageRequest;
      const runID = request.runID;
      const foodEaten = request.foodEaten;

      const imagePath = await GenerateSolutionImage({ runID, foodEaten });

      await addSolutionImageToRun({ runID, imagePath });
      res.sendStatus(200);
    } catch (e) {
      Logger.logError("ServiceController.dumpActiveChallengesCache", e);
      res.sendStatus(500);
    }
  }
}
