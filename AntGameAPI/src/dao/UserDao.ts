import { Collection, ObjectId } from "mongodb";
import { UserEntity } from "./entities/UserEntity";
import { TryParseObjectID } from "./helpers";
import { MongoConnection } from "./MongoClientTS";

export class UserDao {
    private _collection: Collection<UserEntity>;

    private async getCollection() {
        if (!this._collection) {
            const connection = await MongoConnection.open();
            this._collection = connection.db("challenges").collection("challenge-records");
        }
        return this._collection;
    }

    public async isUserBanned(id: ObjectId | string) {
        if (typeof id === "string") id = TryParseObjectID(id, "UserId", "UserDao.isUserBanned");

        const collection = await this.getCollection();
        const result = await collection.findOne({ _id: id }, { projection: { banned: 1 } })

        if (!result) return true
        return result.banned
    }

    public async isUserAdmin(id: ObjectId | string) {
        if (typeof id === "string") id = TryParseObjectID(id, "UserId", "UserDao.isUserAdmin");

        const collection = await this.getCollection();
        const result = await collection.findOne({ _id: id }, { projection: { admin: 1 } })

        if (!result) return true
        return result.admin
    }

    public async getUsernameById(id: ObjectId | string) {
        if (typeof id === "string") id = TryParseObjectID(id, "UserId", "UserDao.getUsernameById");

        const collection = await this.getCollection();
        const result = await collection.findOne({ _id: id }, { projection: { username: 1 } });
        return result.username;
    }

    public async shouldShowUserOnLeaderboard(id) {
        
    }
}