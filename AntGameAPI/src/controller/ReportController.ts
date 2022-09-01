import { Request, Response } from "express";
import { AuthToken } from "../auth/models/AuthToken";
import { ReportDao } from "../dao/ReportDao";
import { FlagHandler } from "../handler/FlagHandler";
import { GetIpAddress } from "../helpers/IpHelper";
import { LoggerProvider } from "../LoggerTS";
import { MessageType } from "../models/Logging/MessageTypes";
import { SpacesLog } from "../models/Logging/SpacesLog";
import { SpacesReport } from "../models/SpacesReport";

const Logger = LoggerProvider.getInstance();
const FlagCache = FlagHandler.getCache();

const _reportDao = new ReportDao();

export class ReportController {
  static async reportAssetLoad(req: Request, res: Response) {
    try {
      const data = req.body as SpacesReport;
      const user = req.user as AuthToken;
      const ip = GetIpAddress(req);

      if (await FlagCache.getBoolFlag("enable.save-asset-reports")) {
        const username = user.username ? user.username : false;
        await _reportDao.saveAssetLoadReport(username, data.time, data.path, data.status, ip);
      }

      const toLog: SpacesLog = {
        message: MessageType.SpacesLoadData,
        time: data.time,
        path: data.path,
        status: data.status,
        ip,
      };
      Logger.log(toLog);
      res.sendStatus(200);
    } catch (error) {
      Logger.logError("ReportController.reportSpacesData", error as Error);
      res.sendStatus(500);
    }
  }
}
