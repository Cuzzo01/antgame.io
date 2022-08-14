import { SkinnyChallengeConfig } from "./SkinnyChallengeConfig";
import { LeaderboardEntry } from "./LeaderboardEntry";
import { RawLeaderboardEntry } from "./RawLeaderboardEntry";
import { RecordDetails } from "./RecordDetails";

export interface HomePageResponse {
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
  wr: RecordDetails;
}
