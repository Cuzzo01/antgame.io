export interface RunSubmissionResponse {
  playerCount?: number;
  rank?: number;
  pr?: number;
  wr?: { score: number; name: string; id: string };
  isWrRun?: boolean;
}
