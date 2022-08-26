import { ObjectId } from "mongodb";
import { ChallengeRecord } from "./ChallengeRecord";
import { UserPointsRow } from "./FullChampionshipConfig";

export interface FullChallengeConfig {
  _id?: ObjectId;
  id?: string;
  mapPath?: string;
  mapID: ObjectId;
  seconds: number;
  homeLimit: number;
  name: string;
  active: boolean;
  championshipID?: ObjectId;
  pointsAwarded?: UserPointsRow[];
  dailyChallenge: boolean;
  solutionImage?: string;
  order?: number;
  thumbnailURL?: string;
  record?: ChallengeRecord;
}
