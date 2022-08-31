import { BadgeIcons } from "./BadgeIcons";

export interface UserBadge {
  name: string;
  color: string;
  icon: BadgeIcons;
  backgroundColor: string;
  value?: number;
}
