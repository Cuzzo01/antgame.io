import LogzIo, { ILogzioLogger } from "logzio-nodejs";
import TelemAPI from "@opentelemetry/api";

import { ApiErrorLog } from "./models/Logging/ApiErrorLog";
import { AuthEventLog } from "./models/Logging/AuthEventLog";
import { BaseLogMessage } from "./models/Logging/BaseLogMessage";
import { CacheLog, CacheResultType } from "./models/Logging/CacheLog";
import { CronLog } from "./models/Logging/CronLog";
import { InfoLog } from "./models/Logging/InfoLog";
import { MessageType } from "./models/Logging/MessageTypes";

export class LoggerProvider {
  private static LoggerInstance: LoggerBase;

  public static getInstance(): LoggerBase {
    if (this.LoggerInstance) return this.LoggerInstance;
    this.LoggerInstance = new LoggerBase();
    return this.LoggerInstance;
  }
}

export class LoggerBase {
  private logger: ILogzioLogger;
  private env: string;

  constructor() {
    this.logger = LogzIo.createLogger({
      token: process.env.logzio_token,
      protocol: "https",
      host: "listener.logz.io",
      port: "8071",
      type: "AntGameAPI",
    });
  }

  init() {
    this.env = process.env.environment;
    if (this.env === undefined) {
      this.env = "NO ENV SET";
    }
  }

  log(obj: BaseLogMessage) {
    if (!this.env) this.init();
    if (this.env !== "LOCAL") {
      const toLog = { ...obj, env: this.env };
      const activeSpan = TelemAPI.trace.getSpan(TelemAPI.context.active());
      if (activeSpan) {
        const traceID = activeSpan.spanContext().traceId;
        toLog.traceID = traceID;
      }
      this.logger.log(toLog);
    } else {
      console.log(new Date().toISOString(), JSON.stringify(obj));
    }
  }

  logError(location: string, err: string | Error) {
    const errString = typeof err === "string" ? err : err.stack;
    const logObject: ApiErrorLog = {
      message: MessageType.ApiError,
      err: errString,
      location,
    };
    this.log(logObject);
  }

  logAuthEvent(eventData: AuthEventLog) {
    eventData.message = MessageType.AuthEvent;
    this.log(eventData);
  }

  logCacheResult(cacheName: string, cacheMiss: boolean, key: string, value: string, time: number) {
    const toLog: CacheLog = {
      message: MessageType.CacheResult,
      cacheName,
      resultType: cacheMiss ? CacheResultType.Miss : CacheResultType.Hit,
      key: key,
      time: time,
    };

    if (value && value.length) toLog.value = value;
    this.log(toLog);
  }

  logCronMessage(message: string) {
    const toLog: CronLog = {
      message: MessageType.DailyCron,
      cronMessage: message,
    };
    this.log(toLog);
  }

  info(source: string, infoText: string) {
    const toLog: InfoLog = {
      message: MessageType.Info,
      source: source,
      infoText: infoText,
    };
    this.log(toLog);
  }
}
