export interface RunEntityProjection {
  details: {
    homeLocations: number[][];
    seed: number;
    snapshots: any[][];
  };
  submissionTime: Date;
  score: number;
  tagTypes: string[];
}
