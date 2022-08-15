import { Request, Response } from "express";
import { GetIpAddress } from "../helpers/IpHelperTS";
import { LoggerProvider } from "../LoggerTS";
import { MessageType } from "../models/Logging/MessageTypes";
import { SpacesLog } from "../models/Logging/SpacesLog";
import { SpacesReport } from "../models/SpacesReport";

const Logger = LoggerProvider.getInstance();

export class ReportController {
  static reportSpacesData(req: Request, res: Response) {
    try {
      const data = req.body as SpacesReport;
      const toLog: SpacesLog = {
        message: MessageType.SpacesLoadData,
        time: data.time,
        path: data.path,
        status: data.status,
        ip: GetIpAddress(req),
      };
      Logger.log(toLog);
      res.sendStatus(200);
    } catch (error) {
      Logger.logError("ReportController.reportSpacesData", error as Error);
      res.sendStatus(500);
    }
  }
}
