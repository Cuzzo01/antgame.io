import { ObjectId } from "mongodb";
import { UserBadge } from "./UserBadge";

export interface UserDetails {
  _id: ObjectId;
  username: string;
  badges: UserBadge[];
  joinDate?: Date | false;
  admin?: boolean;
}
