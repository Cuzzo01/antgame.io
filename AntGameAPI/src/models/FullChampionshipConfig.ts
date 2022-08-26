export interface FullChampionshipConfig {
  _id: string;
  name: string;
  pointsMap: PointMapRow[];
  userCount: number;
  configs: string[];
  userPoints: UserPointsRow[];
  lastAwarded: string;
}

export interface PointMapRow {
  type: string;
  value: number;
  points: number;
}

export interface UserPointsRow {
  userID: string;
  points: number;
}
