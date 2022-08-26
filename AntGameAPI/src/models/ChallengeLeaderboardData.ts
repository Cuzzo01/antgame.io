import { LeaderboardEntry } from "./LeaderboardEntry";

export interface ChallengeLeaderboardData {
  leaderboardRows: LeaderboardEntry[];
  solutionImgPath: string;
  isDaily: boolean;
  playerCount: number;
}
