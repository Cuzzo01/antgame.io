import { BaseLogMessage } from "./BaseLogMessage";

export interface SpacesLog extends BaseLogMessage {
  time: number;
  path: string;
  status: number;
  ip: string;
}
