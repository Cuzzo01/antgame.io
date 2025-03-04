import newrelic from "newrelic";
import TelemAPI from "@opentelemetry/api";

import { ApiErrorLog } from "./models/Logging/ApiErrorLog";
import { AuthEventLog } from "./models/Logging/AuthEventLog";
import { BaseLogMessage, LogLevel } from "./models/Logging/BaseLogMessage";
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
  private env: string;

  constructor() {
    this.init();
  }

  init() {
    this.env = process.env.environment;
    if (this.env === undefined) {
      this.env = "NO ENV SET";
    }
  }

  log(obj: BaseLogMessage) {
    if (!this.env) this.init();
    
    const toLog = { ...obj, env: this.env };
    if (this.env !== "LOCAL") {
      const activeSpan = TelemAPI.trace.getSpan(TelemAPI.context.active());
      if (activeSpan) {
        const traceID = activeSpan.spanContext().traceId;
        toLog.traceID = traceID;
      }

      newrelic.recordLogEvent(toLog);
      if (obj.level === LogLevel.Error && obj.message === MessageType.ApiError) {
        const err = (obj as ApiErrorLog).err;
        newrelic.noticeError(err);
      }
    } else {
      console.log(new Date().toISOString(), JSON.stringify(toLog));
    }
  }

  logError(location: string, err: string | Error) {
    const errString = typeof err === "string" ? err : err.stack;
    const logObject: ApiErrorLog = {
      message: MessageType.ApiError,
      err: errString,
      level: LogLevel.Error,
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
      level: LogLevel.Info,
    };

    if (value && value.length) toLog.value = value;
    this.log(toLog);
  }

  logCronMessage(message: string) {
    const toLog: CronLog = {
      message: MessageType.DailyCron,
      cronMessage: message,
      level: LogLevel.Info,
    };
    this.log(toLog);
  }

  info(source: string, infoText: string) {
    const toLog: InfoLog = {
      message: MessageType.Info,
      source: source,
      infoText: infoText,
      level: LogLevel.Info,
    };
    this.log(toLog);
  }
}
