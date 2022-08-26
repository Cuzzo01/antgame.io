import { PointMapRow, UserPointsRow } from "./FullChampionshipConfig";
import { RawLeaderboardEntry } from "./RawLeaderboardEntry";

export interface ChampionshipResponse {
  leaderboard: RawLeaderboardEntry[];
  pointMap: PointMapRow[];
  lastPointsAwarded?: UserPointsRow[];
}
