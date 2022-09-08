import { RawLeaderboardEntry } from "./RawLeaderboardEntry";

export interface LeaderboardEntryWithUsername extends RawLeaderboardEntry {
  username: string;
}
