import { UserPointsRow } from "./FullChampionshipConfig";

export interface FullChallengeConfig {
  id: string;
  mapPath: string;
  mapID: string;
  seconds: number;
  homeLimit: number;
  name: string;
  active: boolean;
  championshipID: string;
  pointsAwarded: UserPointsRow[];
  dailyChallenge: boolean;
  solutionImage: string;
}
