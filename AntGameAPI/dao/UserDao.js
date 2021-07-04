const { ObjectID } = require("mongodb");
const { Connection } = require("./MongoClient");

const getCollection = async (collection) => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

// const getAllPBsByUser = async (userID) => {
//   const userObjectID = new ObjectID(userID);
//   const collection = await getCollection("users")
//   const result = await collection.findOne(
//     { _id: userObjectID },
//     { projection: { "challengeDetails": { "challengeID": 1, "PB": 1 } } }
//   )
//   return result.challengeDetails
// }

const getChallengeDetailsByUser = async (userID, challengeID) => {
  const userObjectID = new ObjectID(userID);
  const challengeObjectID = new ObjectID(challengeID);
  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID, "challengeDetails.ID": challengeObjectID },
    { projection: { "challengeDetails.$": 1 } }
  );
  if (result === null) return null;
  return result.challengeDetails[0];
};

const updateChallengePBAndRunCount = async (userID, challengeID, score) => {
  const userObjectID = new ObjectID(userID);
  const challengeObjectID = new ObjectID(challengeID);
  const collection = await getCollection("users");
  const result = await collection.updateOne(
    { _id: userObjectID },
    {
      $set: { "challengeDetails.$[challenge].pb": score },
      $inc: { "challengeDetails.$[challenge].runs": 1 },
    },
    {
      arrayFilters: [{ "challenge.ID": challengeObjectID }],
    }
  );
};

const incrementChallengeRunCount = async (userID, challengeID) => {
  const userObjectID = new ObjectID(userID);
  const challengeObjectID = new ObjectID(challengeID);
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

const addNewChallengeDetails = async (userID, challengeID, score) => {
  const userObjectID = new ObjectID(userID);
  const challengeObjectID = new ObjectID(challengeID);
  const collection = await getCollection("users");
  const result = await collection.updateOne(
    { _id: userObjectID },
    {
      $push: {
        challengeDetails: {
          ID: challengeObjectID,
          pb: score,
          runs: 1,
        },
      },
    }
  );
};

module.exports = {
  updateChallengePBAndRunCount,
  addNewChallengeDetails,
  getChallengeDetailsByUser,
  incrementChallengeRunCount,
};
