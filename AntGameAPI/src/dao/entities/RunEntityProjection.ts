export interface RunEntityProjection {
  details: {
    homeLocations: number[][];
    seed: number;
    finalSnapshot: (number | { [key: string]: number })[];
    compatibilityDate: string;
  };
  submissionTime: Date;
  score: number;
  tagTypes: string[];
}
