import { ObjectId } from "mongodb";

export interface ChallengeRecord {
  score: number;
  username: string;
  id: string;
  runID: ObjectId;
}
