import { SkinnyChallengeConfig } from "./SkinnyChallengeConfig";
import { LeaderboardEntry } from "./LeaderboardEntry";
import { RawLeaderboardEntry } from "./RawLeaderboardEntry";
import { RecordDetails } from "./RecordDetails";

export interface ActiveChallengeResponse {
  challenges: SkinnyChallengeConfig[];
  championshipData: ChampionshipData;
  records: Records;
  yesterdaysDailyData: DailyData;
}

export interface ChampionshipData {
  id: string;
  name: string;
  leaderboard: RawLeaderboardEntry[];
}

export interface Records {
  [ChallengeID: string]: RecordsEntry;
}

export interface DailyData {
  id: string;
  leaderboardData: LeaderboardEntry[];
  name: string;
}

export interface RecordsEntry {
  wr?: RecordDetails;
  pb?: number;
  pr?: number | string; // TODO: make this just one field
  runs?: number;
  rank?: number;
  playerCount?: number;
}
