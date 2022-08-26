import { MessageType } from "./MessageTypes";

export class BaseLogMessage {
  env?: string;
  message?: MessageType;
  traceID?: string;
}
