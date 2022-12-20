import { ObjectId } from "mongodb";

export interface AuthDetails {
  _id?: ObjectId;
  username: string;
  passHash: string;
  admin: boolean;
  banned: boolean;
  banInfo: BanInfo;
}

export interface BanInfo {
  message: string;
}
