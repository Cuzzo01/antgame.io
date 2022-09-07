import { Collection, ObjectId } from "mongodb";
import { ChallengeRecordEntity } from "./entities/ChallengeRecordEntity";
import { TryParseObjectID } from "./helpers";
import { MongoConnection } from "./MongoClientTS";

export class ChallengeRecordDao {
  private _collection: Collection<ChallengeRecordEntity>;

  private async getCollection() {
    if (!this._collection) {
      const connection = await MongoConnection.open();
      this._collection = connection.db("challenges").collection("challenge-records");
    }
    return this._collection;
  }

  public async getChallengeLeaderboard(challengeId: ObjectId | string, recordCount = 0) {
    if (typeof challengeId === "string") challengeId = TryParseObjectID(challengeId, "ChallengeId");

    const collection = await this.getCollection();
    return await collection.find({ challengeId }).sort({ score: -1 }).limit(recordCount).toArray();
  }

  public async addNewRecord(
    challengeId: ObjectId | string,
    userId: ObjectId | string,
    score: number,
    runId: ObjectId | string
  ) {
    if (typeof challengeId === "string") challengeId = TryParseObjectID(challengeId, "ChallengeId");
    if (typeof userId === "string") userId = TryParseObjectID(userId, "userId");
    if (typeof runId === "string") runId = TryParseObjectID(runId, "ChallengeId");

    const collection = await this.getCollection();
    await collection.insertOne({
      challengeId,
      userId,
      runId,
      runs: 1,
      score,
    });
  }

  public async updateRecord(
    challengeId: ObjectId | string,
    userId: ObjectId | string,
    score: number,
    runId: ObjectId | string
  ) {
    if (typeof challengeId === "string") challengeId = TryParseObjectID(challengeId, "ChallengeId");
    if (typeof userId === "string") userId = TryParseObjectID(userId, "userId");
    if (typeof runId === "string") runId = TryParseObjectID(runId, "ChallengeId");

    const collection = await this.getCollection();
    await collection.updateOne(
      { challengeId, userId },
      { $set: { runId, score }, $inc: { runs: 1 } }
    );
  }

  public async incrementRunCount(challengeId: ObjectId | string, userId: ObjectId | string) {
    if (typeof challengeId === "string") challengeId = TryParseObjectID(challengeId, "ChallengeId");
    if (typeof userId === "string") userId = TryParseObjectID(userId, "userId");

    const collection = await this.getCollection();
    await collection.updateOne({ challengeId, userId }, { $inc: { runs: 1 } });
  }

  public async getRecord(challengeId: ObjectId | string, userId: ObjectId | string) {
    if (typeof challengeId === "string") challengeId = TryParseObjectID(challengeId, "ChallengeId");
    if (typeof userId === "string") userId = TryParseObjectID(userId, "userId");

    const collection = await this.getCollection();
    return await collection.findOne({ challengeId, userId });
  }

  public async getUserRecords(userId: ObjectId | string, challengeIdList: ObjectId[]) {
    if (typeof userId === "string") userId = TryParseObjectID(userId, "userId");

    const collection = await this.getCollection();
    return await collection.find({ userId, challengeId: { $in: challengeIdList } }).toArray();
  }

  public async deleteRecord(challengeId: ObjectId | string, userId: ObjectId | string) {
    if (typeof challengeId === "string") challengeId = TryParseObjectID(challengeId, "ChallengeId");
    if (typeof userId === "string") userId = TryParseObjectID(userId, "userId");

    const collection = await this.getCollection();
    await collection.deleteOne({ challengeId, userId });
  }
}
