import { Request, Response } from "express";
import { RejectIfAnon } from '../auth/AuthHelpers';
import { AuthToken } from "../auth/models/AuthToken";
import { getRunsByUserIdAndChallengeId } from '../dao/RunHistoryDao';
import { FlagHandler } from "../handler/FlagHandler";
import { LoggerProvider } from "../LoggerTS";

const Logger = LoggerProvider.getInstance();
const FlagCache = FlagHandler.getCache();

export class RunHistoryController {

    static async getRunHistory(req: Request, res: Response) {
        try {
            if (RejectIfAnon(req, res)) return;

            const userId = (req.user as AuthToken).id;
            const challengeId = req.body.challengeId;
            const pageIndex = req.body.pageIndex;
            const pageLength = await FlagCache.getIntFlag("batch-size.run-history");


            const result = await getRunsByUserIdAndChallengeId({challengeId, userId, pageIndex, pageLength});
            res.send(result);
    
      } catch (e) {
        Logger.logError("RunHistoryController.getRunHistory", e);
        res.send(500);
      }
    }
}
