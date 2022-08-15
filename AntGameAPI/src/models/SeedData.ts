export interface SeedData {
  // TODO: should be ObjectID
  _id?: any;
  homeLocations: number[][];
  userID: string;
  createdAt: number;
  expiresAt?: Date;
}
