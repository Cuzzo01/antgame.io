import { BadgeIcons } from "../models/BadgeIcons";
import { RawUserBadge } from "../models/RawUserBadge";

export class BadgeDataGenerator {
  static getFirstPlaceBadge(name: string) {
    return this.getTrophyBadge({ name: `1st ${name}`, backgroundColor: "gold", value: 99 });
  }

  static getSecondPlaceBadge(name: string) {
    return this.getTrophyBadge({ name: `2nd ${name}`, backgroundColor: "silver", value: 98 });
  }
  static getThirdPlaceBadge(name: string) {
    return this.getTrophyBadge({ name: `3rd ${name}`, backgroundColor: "bronze", value: 97 });
  }

  static getTopTenBadge(rank: number, name: string) {
    return <RawUserBadge>{
      name: `${rank}th ${name}`,
      backgroundColor: "green",
      value: 100 - rank,
    };
  }

  static getTop50Badge(rank: number, name: string) {
    return <RawUserBadge>{
      name: `#${rank} ${name}`,
      color: "white",
      value: 100 - rank,
    };
  }

  static getTrophyBadge(p: { name: string; backgroundColor: string; value: number }) {
    return <RawUserBadge>{
      icon: BadgeIcons.Trophy,
      name: p.name,
      backgroundColor: p.backgroundColor,
      value: p.value,
    };
  }
}
