export interface RunEntityProjection {
  details: {
    homeLocations: number[][];
    seed: number;
    finalSnapshot: (number | { [key: string]: number })[];
  };
  submissionTime: Date;
  score: number;
  tagTypes: string[];
}
