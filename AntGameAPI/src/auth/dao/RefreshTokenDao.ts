import { Collection } from "mongodb";
import { MongoConnection } from "../../dao/MongoClientTS";
import { RefreshTokenEntity } from "./entity/RefreshTokenEntity";

export class RefreshTokenDao {
  private _collection: Collection<RefreshTokenEntity>;

  private async getCollection() {
    if (!this._collection) {
      const connection = await MongoConnection.open();
      this._collection = connection.db("challenges").collection("refresh-tokens");
    }
    return this._collection;
  }

  public async saveNewToken(refreshToken: RefreshTokenEntity) {
    const collection = await this.getCollection();

    await collection.insertOne(refreshToken);
  }

  public async getTokenRecord(token: string) {
    const collection = await this.getCollection();

    const result = await collection.findOne({ token });
    if (!result) return false;

    return result;
  }

  public async deleteTokenRecord(token: string) {
    const collection = await this.getCollection();

    const result = await collection.deleteOne({ token })

    return result.deletedCount === 1
  }

  public async renewRefreshToken(token: string, expiresAt: Date) {
    const collection = await this.getCollection();

    await collection.updateOne({ token }, { $set: { expiresAt } });
  }
}
