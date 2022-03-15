const Connection = require("./MongoClient");
const Mongo = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getRunIDsToVerify = async () => {
  const collection = await getCollection("runs");
  const result = await collection.find({ toVerify: true }).limit(50).toArray();
  return result;
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

const unsetToVerifyFlag = async ({ runID }) => {
  const runObjectID = TryParseObjectID(runID, "RunID");

  const collection = await getCollection("runs");
  await collection.updateOne({ _id: runObjectID }, { $unset: { toVerify: "" } });
};
module.exports = {
  getChallengeDetailsByID,
  getRunDetailsByID,
  getRunIDsToVerify,
  addTagToRun,
  unsetToVerifyFlag,
};

const TryParseObjectID = (stringID, name) => {
  try {
    return new Mongo.ObjectID(stringID);
  } catch (e) {
    throw `Threw on ${name} parsing in Generic DAO: ${stringID}`;
  }
};
