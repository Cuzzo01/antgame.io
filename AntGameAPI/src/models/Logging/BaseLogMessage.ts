import { MessageType } from "./MessageTypes";

export class BaseLogMessage {
  env?: string;
  message?: MessageType;
  traceID?: string;
  level: LogLevel;
}

export enum LogLevel {
  Info = "info",
  Error = "error",
}
