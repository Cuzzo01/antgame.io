const Connection = require("./MongoClient");
const Mongo = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getRunToVerify = async () => {
  const collection = await getCollection("runs");
  const result = await collection.findOneAndUpdate(
    { toVerify: true, "verification.startTime": null },
    { $set: { "verification.startTime": new Date() } }
  );
  return result.value;
};

const getChallengeDetailsByID = async ({ challengeID }) => {
  const configObjectID = TryParseObjectID(challengeID, "ChallengeID");

  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: configObjectID });
  return result;
};

const getRunDetailsByID = async ({ runID }) => {
  const runObjectID = TryParseObjectID(runID, "RunID");

  const collection = await getCollection("runs");
  const result = await collection.findOne({ _id: runObjectID });

  return result;
};

const addTagToRun = async ({ id, tag }) => {
  const runObjectID = TryParseObjectID(id, "RunID");

  const collection = await getCollection("runs");
  await collection.updateOne({ _id: runObjectID }, { $push: { tags: { $each: [tag] } } });
};

const unsetToVerifyFlagAndSetFinishTime = async ({ runID }) => {
  const runObjectID = TryParseObjectID(runID, "RunID");

  const collection = await getCollection("runs");
  await collection.updateOne(
    { _id: runObjectID },
    { $unset: { toVerify: "" }, $set: { "verification.finishTime": new Date() } }
  );
};

const fixOrphanedRuns = async ({ cutoffTime }) => {
  const collection = await getCollection("runs");
  const result = await collection.updateMany({ "verification.startTime": { $lt: cutoffTime }, "verification.finishTime": null }, { $unset: {"verification.startTime": null}, $inc: { "verification.resets": 1 } })
  return result.modifiedCount
}
module.exports = {
  getChallengeDetailsByID,
  getRunDetailsByID,
  getRunToVerify,
  addTagToRun,
  unsetToVerifyFlagAndSetFinishTime,
  fixOrphanedRuns
};

const TryParseObjectID = (stringID, name) => {
  try {
    return new Mongo.ObjectID(stringID);
  } catch (e) {
    throw `Threw on ${name} parsing in Generic DAO: ${stringID}`;
  }
};
