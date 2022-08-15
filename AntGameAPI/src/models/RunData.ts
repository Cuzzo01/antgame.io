export interface RunData {
  challengeID: string;
  userID: string;
  score: number;
  homeLocations: number[][];
  homeAmounts: HomeAmount;
  solutionImage: string;
  runNumber: number;
}

export interface HomeAmount {
  [location: string]: number;
}
