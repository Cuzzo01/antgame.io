import { Collection, ObjectId } from "mongodb";
import { ChallengeRecordEntity } from "./entities/ChallengeRecordEntity";
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

  public async getChallengeLeaderboard(challengeId: ObjectId, recordCount = 0) {
    const collection = await this.getCollection();
    return await collection.find({ challengeId }).sort({ score: -1 }).limit(recordCount).toArray();
  }

  public async addNewRecord(
    challengeId: ObjectId,
    userId: ObjectId,
    score: number,
    runId: ObjectId
  ) {
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
    challengeId: ObjectId,
    userId: ObjectId,
    score: number,
    runId: ObjectId
  ) {
    const collection = await this.getCollection();
    await collection.updateOne({ challengeId, userId }, { runId, $inc: { runs: 1 }, score });
  }

  public async incrementRunCount(challengeId: ObjectId, userId: ObjectId) {
    const collection = await this.getCollection();
    await collection.updateOne({ challengeId, userId }, { $inc: { runs: 1 } });
  }

  public async getRecord(challengeId: ObjectId, userId: ObjectId) {
    const collection = await this.getCollection();
    return await collection.findOne({ challengeId, userId });
  }

  public async getUserRecords(userId: ObjectId, challengeIdList: ObjectId[]) {
    const collection = await this.getCollection();
    return await collection.find({ userId, challengeId: { $in: challengeIdList } }).toArray();
  }

  // public async getRecordRunID() { }
}
