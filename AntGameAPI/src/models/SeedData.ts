import { ObjectId } from "mongodb";

export interface SeedData {
  _id?: ObjectId;
  homeLocations: number[][];
  userID: ObjectId;
  createdAt: number;
  expiresAt?: Date;
}
