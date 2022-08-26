import { ObjectId } from "mongodb";
import { RunArtifact } from "../RunArtifact";

export interface RunData {
  submissionTime: Date;
  name: string;
  userID: ObjectId;
  score: number;
  challengeID: ObjectId;
  tags: RunArtifact[];
  username?: string;
}
