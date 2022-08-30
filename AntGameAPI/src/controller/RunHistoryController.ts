const Logger = require("../Logger");
import { Request, Response } from "express";
import { RejectIfAnon } from '../auth/AuthHelpers';
import { AuthToken } from "../auth/models/AuthToken";
import { getRunsByUserIdAndChallengeId } from '../dao/RunHistoryDao';

export class RunHistoryController {

    static async getRunHistory(req: Request, res: Response) {
        try {
            if (RejectIfAnon(req, res)) return;

            const userId = (req.user as AuthToken).id;
            const challengeId = req.body.challengeId;
            const itemsToGrab = req.body.itemsToGrab;
            const timeBeforeDate = req.body.timeBefore;
            const timeBefore = new Date(timeBeforeDate).toISOString();

            const result = await getRunsByUserIdAndChallengeId({challengeId, userId, timeBefore, itemsToGrab});
            res.send(result);
    
      } catch (e) {
        Logger.logError("RunHistoryController.getRunHistory", e);
        res.send(500);
      }
    }
}
