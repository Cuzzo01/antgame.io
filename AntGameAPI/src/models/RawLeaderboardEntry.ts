import { ObjectId } from "mongodb";

export interface RawLeaderboardEntry {
  _id: ObjectId;
  pb?: number;
  runID?: ObjectId;
  points?: number;
  noRank?: boolean;
}
