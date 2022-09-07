const { getCollection } = require("./DaoHelpers");

class ChallengeRecordDao {
  _collection = false;

  async getCollection() {
    if (!this._collection) {
      this._collection = getCollection("challenge-records");
    }
    return this._collection;
  }

  async getChallengeLeaderboard(challengeId, recordCount = 0) {
    const collection = await this.getCollection();
    return await collection.find({ challengeId }).sort({ score: -1 }).limit(recordCount).toArray();
  }

  async addNewRecord(challengeId, userId, score, runId) {
    const collection = await this.getCollection();
    await collection.insertOne({
      challengeId,
      userId,
      runId,
      runs: 1,
      score,
    });
  }

  async updateRecord(challengeId, userId, score, runId) {
    const collection = await this.getCollection();
    await collection.updateOne(
      { challengeId, userId },
      { $set: { runId, score }, $inc: { runs: 1 } }
    );
  }

  async incrementRunCount(challengeId, userId) {
    const collection = await this.getCollection();
    await collection.updateOne({ challengeId, userId }, { $inc: { runs: 1 } });
  }

  async getRecord(challengeId, userId) {
    const collection = await this.getCollection();
    const query = { challengeId, userId };
    return await collection.findOne(query);
  }

  async getUserRecords(userId, challengeIdList) {
    const collection = await this.getCollection();
    return await collection.find({ userId, challengeId: { $in: challengeIdList } }).toArray();
  }

  async deleteRecord(challengeId, userId) {
    const collection = await this.getCollection();
    await collection.deleteOne({ challengeId, userId });
  }
}
module.exports = { ChallengeRecordDao };
