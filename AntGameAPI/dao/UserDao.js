const { ObjectID } = require("mongodb");
const { Connection } = require("./MongoClient");
const {getGeneralizedTimeString} = require("../helpers/TimeHelper")

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getUserPBsByChallengeList = async (userID, challengeIDList) => {
  let objectIDList = [];
  challengeIDList.forEach(id => {
    const parseResult = TryParseObjectID(id, "listChallengeID");
    objectIDList.push(parseResult);
  });
  const userObjectID = TryParseObjectID(userID, "userID");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID, "challengeDetails.ID": { $in: objectIDList } },
    { projection: { "challengeDetails.ID": 1, "challengeDetails.pb": 1 } }
  );
  if (!result) return null;
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

const updateChallengePBAndRunCount = async (userID, challengeID, score, runID) => {
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

const getPRRunIDByChallengeID = async (userID, challengeID) => {
  const userObjectID = TryParseObjectID(userID, "userID");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    {
      _id: userObjectID,
      "challengeDetails.ID": challengeObjectID,
    },
    {
      projection: {
        challengeDetails: {
          $elemMatch: { ID: challengeObjectID },
        },
      },
    }
  );
  if (!result) return null;
  return result.challengeDetails[0].pbRunID;
};

const getLeaderboardByChallengeId = async id => {
  const challengeObjectID = TryParseObjectID(id, "challengeID");

  const collection = await getCollection("users");
  // prettier-ignore
  const result = await collection
    .aggregate([
      { $unwind: "$challengeDetails" },
      {
        $match: {
          "challengeDetails.ID": challengeObjectID,
          showOnLeaderboard: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          username: { $first: "$username" },
          pb: { $first: "$challengeDetails.pb" },
          runID: { $first: "$challengeDetails.pbRunID" }
        },
      },
      { $sort: { pb: -1, runID: 1 } },
      { $limit: 5 },
    ])
    .toArray();

  let leaderboard = [];
  result.forEach(challenge => {
    const recordTime = challenge.runID.getTimestamp();
    const timeDelta = new Date() - recordTime;
    const timeString = getGeneralizedTimeString(timeDelta);
    leaderboard.push({
      username: challenge.username,
      pb: challenge.pb,
      age: timeString,
    });
  });
  return leaderboard;
};

const getLeaderboardRankByScore = async (challengeID, score) => {
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");

  const collection = await getCollection("users");
  // prettier-ignore
  const result = await collection
    .aggregate([
      { $unwind: "$challengeDetails" },
      {
        $match: {
          "challengeDetails.ID": challengeObjectID,
          showOnLeaderboard: true,
          "challengeDetails.pb": {$gt: score}
        },
      },
      {
        $group: {
          _id: "$_id",
          username: { $first: "$username" },
          pb: { $first: "$challengeDetails.pb" },
          runID: { $first: "$challengeDetails.pbRunID"}
        },
      },
      { $sort: { pb: -1, runID: 1 } },
      { $count: "usersAhead" }
    ])
    .toArray();

  return result[0];
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
  getPRRunIDByChallengeID,
  getLeaderboardByChallengeId,
  getLeaderboardRankByScore,
};
