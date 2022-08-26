import { UserPointsRow } from "./FullChampionshipConfig";

export interface ChampionshipDetails {
  _id: string;
  name: string;
  userCount: number;
  pointsMap: PointsMapRow[];
  configs: string[];
  userPoints: UserPointsRow[];
}

export interface PointsMapRow {
  type: PointsMapRowTypes;
  value: number;
  points: number;
}

export enum PointsMapRowTypes {
  Rank = "rank",
  Percent = "percent",
}
