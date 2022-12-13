import { ObjectId } from "mongodb";

export interface RefreshTokenEntity {
  token: string;
  clientId: string;
  userId: ObjectId;
  expiresAt: Date;
  createdAt: Date;
}
