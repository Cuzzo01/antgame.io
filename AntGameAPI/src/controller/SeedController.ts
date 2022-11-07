import { Request, Response } from "express";
import { AuthToken } from "../auth/models/AuthToken";
import { CompatibilityService } from "../bll/CompatibilityService";
import { SeedBrokerProvider } from "../bll/SeedBroker";
import { LoggerProvider } from "../LoggerTS";

const Logger = LoggerProvider.getInstance();
const SeedBroker = SeedBrokerProvider.getBroker();

export class SeedController {
  static async getSeed(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const homeLocations = req.body.homeLocations as number[][];
      const userID = (req.user as AuthToken).id;

      if (!homeLocations || homeLocations.length === 0) {
        res.sendStatus(400);
        return;
      }

      const { seed, success } = await SeedBroker.getSeed({ homeLocations, userID });
      if (!success) {
        res.sendStatus(425);
        return;
      }

      const compatibilityDate = CompatibilityService.getCompatibilityDate(new Date());

      res.send({ seed, compatibilityDate });
    } catch (e) {
      Logger.logError("SeedController.getSeed", e as Error);
      res.sendStatus(500);
    }
  }
}
