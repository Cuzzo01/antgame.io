import { BaseLogMessage } from "./BaseLogMessage";

export interface CronLog extends BaseLogMessage {
  cronMessage: string;
}
