import { RunTag } from "./RunTag";

export interface FullRunData {
  challengeID: string;
  userID?: string | false;
  score: number;
  solutionImage?: string;
  submissionTime: Date;
  name: string;
  clientID: string;
  env: string;
  details: {
    homeLocations: number[][];
    timing: { SystemStartTime: number; SystemStopTime: number };
    foodConsumed: number;
    seed: number;
    seedCreateDate: Date;
    snapshots?: unknown;
  };
  tags: RunTag[];
  IP?: string;
}

export interface HomeAmount {
  [location: string]: number;
}
