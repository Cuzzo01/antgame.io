import { Request, Response } from "express";
import { FlagHandler } from "../handler/FlagHandler";
import { LoggerProvider } from "../LoggerTS";

const Logger = LoggerProvider.getInstance();
const FlagCache = FlagHandler.getCache();

export class FlagController {
  static async getFlag(req: Request, res: Response) {
    try {
      const name = req.params.name;
      const { value, bypassCache } = await FlagCache.getFlagData(name);
      if (value === null) {
        res.sendStatus(404);
        return;
      }

      const ttl = FlagCache.getFlagTTL(name);
      if (bypassCache !== true && ttl) {
        const maxAge = await FlagCache.getIntFlag("timeToCacheFlags");
        const age = maxAge - ttl;
        res.set("Cache-Control", `public, max-age=${maxAge}`);
        if (age > 0) res.set("Age", age.toString());
      }

      res.send(value);
    } catch (e) {
      Logger.logError("FlagController", e as Error);
      res.sendStatus(500);
      return;
    }
  }
}
