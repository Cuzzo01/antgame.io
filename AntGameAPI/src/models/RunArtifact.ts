export interface RunRequest {
  data: RunArtifact;
}

export interface RunArtifact {
  challengeID: string;
  Score: number;
  ClientID: string;
  Snapshots: { start: (number | string)[]; finish: (number | string)[] };
  GameConfig: GameConfig;
  HomeLocations: number[][];
  Timing: { SystemStartTime: number; SystemStopTime: number };
  Name: string;
  Env: string;
  FoodConsumed: number;
}

export interface GameConfig {
  MapPath: string;
  Time: number;
  spawnedAnts: number;
  FoodPerCell: number;
  DirtPerCell: number;
  seed: number;
}

export interface HomeFoodAmounts {
  [location: string]: number;
}
