import { BaseLogMessage } from "./BaseLogMessage";

export class InfoLog extends BaseLogMessage {
  source: string;
  infoText: string;
}
