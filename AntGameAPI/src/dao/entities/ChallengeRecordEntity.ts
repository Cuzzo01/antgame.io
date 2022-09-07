import { ObjectId } from "mongodb";

export interface ChallengeRecordEntity {
  challengeId: ObjectId;
  userId: ObjectId;
  runId: ObjectId;
  score: number;
  runs: number;
}
