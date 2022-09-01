import { Collection, Document } from "mongodb";
import { MongoConnection } from "./MongoClientTS";

export class ReportDao {
  private _collection: Collection<Document>;

  private async getCollection() {
    if (!this._collection) {
      const connection = await MongoConnection.open();
      this._collection = connection.db("challenges").collection("reports");
    }
    return this._collection;
  }

  public async saveAssetLoadReport(
    username: string | false,
    time: number,
    path: string,
    status: number,
    ip: string
  ) {
    const collection = await this.getCollection();
    await collection.insertOne({
      type: "spaces",
      username,
      time,
      path,
      status,
      ip,
    });
  }
}
