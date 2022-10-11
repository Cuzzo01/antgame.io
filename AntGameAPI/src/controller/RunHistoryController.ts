import { Request, Response } from "express";
import { RejectIfAnon } from '../auth/AuthHelpers';
import { AuthToken } from "../auth/models/AuthToken";
import { getRunsByUserIdAndChallengeId } from '../dao/RunHistoryDao';
import { LoggerProvider } from "../LoggerTS";

const Logger = LoggerProvider.getInstance();
export class RunHistoryController {

    static async getRunHistory(req: Request, res: Response) {
        try {
            if (RejectIfAnon(req, res)) return;

            const userId = (req.user as AuthToken).id;
            const challengeId = req.body.challengeId;
            const pageIndex = req.body.pageIndex;

            const result = await getRunsByUserIdAndChallengeId({challengeId, userId, pageIndex});
            res.send(result);
    
      } catch (e) {
        Logger.logError("RunHistoryController.getRunHistory", e);
        res.send(500);
      }
    }
}
