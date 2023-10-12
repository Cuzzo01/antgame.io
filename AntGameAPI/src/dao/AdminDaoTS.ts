import { Db } from "mongodb";
import { MongoConnection } from "./MongoClientTS";
import { UserEntity } from "./entities/UserEntity";
import { UserProjections } from "../models/Admin/UserProjection";

export class AdminDao {
  private _connection: Db;

  private async getCollection<T>(collection: string) {
    if (!this._connection) this._connection = (await MongoConnection.open()).db("challenges");

    return this._connection.collection<T>(collection);
  }

  public async getUsersByUsername(username: string, count: number, page = 1) {
    const collection = await this.getCollection<UserEntity>("users");

    return await collection
      .find({ username_lower: { $regex: new RegExp(username) } }, { projection: UserProjections.UsersList })
      .skip((page - 1) * count)
      .limit(count)
      .toArray();
  }

  public async getRecentlyCreatedUsers(count: number, page = 1) {
    const collection = await this.getCollection<UserEntity>("users");

    return collection
      .find({}, { projection: UserProjections.UsersList })
      .sort({ "registrationData.date": -1 })
      .skip((page - 1) * count)
      .limit(count)
      .toArray();
  }

  public async getRecentlyLoggedInUsers(count: number, page = 1) {
    const collection = await this.getCollection<UserEntity>("users");
    const result = await collection
      .find({}, { projection: UserProjections.RecentlyLoggedIn })
      .sort({ "loginRecords.0.time": -1 })
      .skip((page - 1) * count)
      .limit(count)
      .toArray();
    return result;
  }
}
