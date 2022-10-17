export interface RunEntityProjection {
  details: {
    homeLocations: number[][];
    seed: number;
    finalSnapshot: any[];
  };
  submissionTime: Date;
  score: number;
  tagTypes: string[];
}
