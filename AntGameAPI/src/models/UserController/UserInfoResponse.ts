import { UserBadge } from "../UserBadge";

export interface UserInfoResponse {
  id: string;
  username?: string;
  joinDate: string;
  badges: UserBadge[];
}
