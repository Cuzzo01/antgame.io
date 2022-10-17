import { BadgeIcons } from "../../models/BadgeIcons";

export interface UserEntity {
  username: string;
  username_lower: string;
  passHash: string;
  admin: boolean;
  loginCount: number;
  loginRecords: LoginRecord[];
  badges: UserBadge[];
  banned: boolean;
  registrationData: RegData;
}

interface RegData {
  clientID: string;
  IP: string;
  date: Date;
}

interface UserBadge {
  name: string;
  backgroundColor: string;
  color: string;
  value: number;
  display?: boolean;
  icon: BadgeIcons;
}

interface LoginRecord {
  IP: string;
  clientID: string;
  time: Date;
}
