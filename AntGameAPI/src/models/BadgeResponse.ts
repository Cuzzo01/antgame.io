import { UserBadge } from "./UserBadge";

export interface BadgeResponse {
  [userID: string]: UserBadge[];
}
