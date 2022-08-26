import { BaseLogMessage } from "./BaseLogMessage";

export interface AuthEventLog extends BaseLogMessage {
  event: string;
  username?: string;
  ip?: string;
  userID?: string;
  clientID?: string;
  serviceName?: string;
  endpoint?: string;
  adminToken?: boolean;
}
