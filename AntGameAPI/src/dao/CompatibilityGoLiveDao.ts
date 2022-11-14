import { Collection } from "mongodb";
import { GoLiveDateEntity } from "./entities/GoLiveDateEntity";
import { MongoConnection } from "./MongoClientTS";

export class CompatibilityGoLiveDao {
  private _collection: Collection<GoLiveDateEntity>;

  private async getCollection() {
    if (!this._collection) {
      const connection = await MongoConnection.open();
      this._collection = connection.db("challenges").collection("compatibility-go-live-dates");
    }
    return this._collection;
  }

  public async getGoLiveDates(): Promise<GoLiveDateEntity[]> {
    const collection = await this.getCollection();
    const result = await collection.find({}, { projection: { _id: 0 } }).toArray();

    return result.map((e): GoLiveDateEntity => {
      return { featureName: e.featureName, goLive: e.goLive };
    });
  }
}
