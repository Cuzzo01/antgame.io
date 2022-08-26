import { BaseLogMessage } from "./BaseLogMessage";

export interface ApiErrorLog extends BaseLogMessage {
  location: string;
  err: string;
}
