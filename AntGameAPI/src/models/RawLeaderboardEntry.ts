import { ObjectId } from "mongodb";

export interface RawLeaderboardEntry {
  _id: ObjectId;
  username?: string;
  pb?: number;
  runID?: ObjectId;
  points?: number;
  noRank?: boolean;
}
