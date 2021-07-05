const { ObjectID } = require("mongodb");
const { Connection } = require("./MongoClient");

const getCollection = async (collection) => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getUserPBsByChallengeList = async (userID, challengeIDList) => {
  let objectIDList = [];
  challengeIDList.forEach((id) => {
    const parseResult = TryParseObjectID(id, "listChallengeID");
    objectIDList.push(parseResult);
  });
  const userObjectID = TryParseObjectID(userID, "userID");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID, "challengeDetails.ID": { $in: objectIDList } },
    { projection: { "challengeDetails.ID": 1, "challengeDetails.pb": 1 } }
  );
  return result.challengeDetails;
};

const getChallengeDetailsByUser = async (userID, challengeID) => {
  const userObjectID = TryParseObjectID(userID, "userId");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID, "challengeDetails.ID": challengeObjectID },
    { projection: { "challengeDetails.$": 1 } }
  );
  if (result === null) return null;
  return result.challengeDetails[0];
};

const updateChallengePBAndRunCount = async (
  userID,
  challengeID,
  score,
  runID
) => {
  const userObjectID = TryParseObjectID(userID, "userId");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");
  const runObjectID = TryParseObjectID(runID, "runID");

  const collection = await getCollection("users");
  const result = await collection.updateOne(
    { _id: userObjectID },
    {
      $set: {
        "challengeDetails.$[challenge].pb": score,
        "challengeDetails.$[challenge].pbRunID": runObjectID,
      },
      $inc: { "challengeDetails.$[challenge].runs": 1 },
    },
    {
      arrayFilters: [{ "challenge.ID": challengeObjectID }],
    }
  );
};

const incrementChallengeRunCount = async (userID, challengeID) => {
  const userObjectID = TryParseObjectID(userID, "userId");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");

  const collection = await getCollection("users");
  const result = await collection.updateOne(
    { _id: userObjectID },
    {
      $inc: { "challengeDetails.$[challenge].runs": 1 },
    },
    {
      arrayFilters: [{ "challenge.ID": challengeObjectID }],
    }
  );
};

const addNewChallengeDetails = async (userID, challengeID, score, runID) => {
  const userObjectID = TryParseObjectID(userID, "userId");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");
  const runObjectID = TryParseObjectID(runID, "runID");

  const collection = await getCollection("users");
  const result = await collection.updateOne(
    { _id: userObjectID },
    {
      $push: {
        challengeDetails: {
          ID: challengeObjectID,
          pb: score,
          runs: 1,
          pbRunID: runObjectID,
        },
      },
    }
  );
};

const TryParseObjectID = (stringID, name) => {
  try {
    return new ObjectID(stringID);
  } catch (e) {
    throw `Threw on ${name} parsing in UserDao: ${stringID}`;
  }
};

module.exports = {
  updateChallengePBAndRunCount,
  addNewChallengeDetails,
  getChallengeDetailsByUser,
  incrementChallengeRunCount,
  getUserPBsByChallengeList,
};
