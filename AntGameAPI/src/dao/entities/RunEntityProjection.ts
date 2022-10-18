export interface RunEntityProjection {
  details: {
    homeLocations: number[][];
    seed: number;
    snapshots: (number | { [key: string]: number })[][];
  };
  submissionTime: Date;
  score: number;
  tagTypes: string[];
}
