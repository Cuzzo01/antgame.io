import { Collection, ObjectId } from "mongodb";
import { RawUserBadge } from "../models/RawUserBadge";
import { UserDetails } from "../models/UserDetails";
import { UserEntity } from "./entities/UserEntity";
import { TryParseObjectID } from "./helpers";
import { MongoConnection } from "./MongoClientTS";

export class UserDao {
  private _collection: Collection<UserEntity>;

  private async getCollection() {
    if (!this._collection) {
      const connection = await MongoConnection.open();
      this._collection = connection.db("challenges").collection("users");
    }
    return this._collection;
  }

  public async isUserBanned(id: ObjectId | string) {
    if (typeof id === "string") id = TryParseObjectID(id, "UserId", "UserDao.isUserBanned");

    const collection = await this.getCollection();
    const result = await collection.findOne({ _id: id }, { projection: { banned: 1 } });

    if (!result) return true;
    return result.banned === true;
  }

  public async isUserAdmin(id: ObjectId | string) {
    if (typeof id === "string") id = TryParseObjectID(id, "UserId", "UserDao.isUserAdmin");

    const collection = await this.getCollection();
    const result = await collection.findOne({ _id: id }, { projection: { admin: 1 } });

    if (!result) return true;
    return result.admin;
  }

  public async getUsernameById(id: ObjectId | string) {
    if (typeof id === "string") id = TryParseObjectID(id, "UserId", "UserDao.getUsernameById");

    const collection = await this.getCollection();
    const result = await collection.findOne({ _id: id }, { projection: { username: 1 } });
    return result.username;
  }

  public async getUserBadgesByID(id: ObjectId | string) {
    if (typeof id === "string") id = TryParseObjectID(id, "UserId", "UserDao.getUserBadgesByID");

    const collection = await this.getCollection();
    const result = await collection.findOne({ _id: id }, { projection: { badges: 1 } });

    if (!result || !result.badges) return [];
    else return result.badges;
  }

  public async getUserDetails(username?: string, userId?: ObjectId) {
    const collection = await this.getCollection();
    const queryObject: { username_lower?: string; _id?: ObjectId } = {};
    if (username) queryObject.username_lower = username;
    else if (userId) queryObject._id = userId;

    const result = await collection.findOne(queryObject, {
      projection: { _id: 1, username: 1, "registrationData.date": 1, badges: 1, admin: 1 },
    });

    if (!result) return null;
    const toReturn: UserDetails = {
      _id: result._id,
      username: result.username,
      badges: result.badges,
      admin: result.admin,
    };
    if (result.registrationData) toReturn.joinDate = result.registrationData.date;
    else toReturn.joinDate = false;
    return toReturn;
  }

  public async addBadgeToUser(userId: ObjectId | string, badgeData: RawUserBadge) {
    if (typeof userId === "string")
      userId = TryParseObjectID(userId, "UserId", "UserDao.addBadgeToUser");
    const collection = await this.getCollection();
    await collection.updateOne({ _id: userId }, { $push: { badges: { ...badgeData } } });
  }
}
