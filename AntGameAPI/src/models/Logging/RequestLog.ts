import { BaseLogMessage } from "./BaseLogMessage";

export interface RequestLog extends BaseLogMessage {
  method: string;
  url: string;
  ip: string;
  time: number;
  status: number;
}
