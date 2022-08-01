const { TryParseObjectID } = require("./helpers");
const Connection = require("./MongoClient");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getUserPBs = async userID => {
  const userObjectID = TryParseObjectID(userID, "userID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID },
    {
      projection: {
        "challengeDetails.ID": 1,
        "challengeDetails.pb": 1,
        "challengeDetails.runs": 1,
      },
    }
  );
  if (!result) return null;
  return result.challengeDetails;
};

const getChallengeDetailsByUser = async (userID, challengeID) => {
  const userObjectID = TryParseObjectID(userID, "userId", "UserDao");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID, "challengeDetails.ID": challengeObjectID },
    { projection: { "challengeDetails.$": 1 } }
  );
  if (result === null) return null;
  return result.challengeDetails[0];
};

const updateChallengePBAndRunCount = async (userID, challengeID, score, runID) => {
  const userObjectID = TryParseObjectID(userID, "userId", "UserDao");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID", "UserDao");
  const runObjectID = TryParseObjectID(runID, "runID", "UserDao");

  const collection = await getCollection("users");
  await collection.updateOne(
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
  const userObjectID = TryParseObjectID(userID, "userId", "UserDao");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID", "UserDao");

  const collection = await getCollection("users");
  await collection.updateOne(
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
  const userObjectID = TryParseObjectID(userID, "userId", "UserDao");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID", "UserDao");
  const runObjectID = TryParseObjectID(runID, "runID", "UserDao");

  const collection = await getCollection("users");
  await collection.updateOne(
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
  const userObjectID = TryParseObjectID(userID, "userID", "UserDao");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID", "UserDao");

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

const getLeaderboardByChallengeId = async (id, recordCount) => {
  const challengeObjectID = TryParseObjectID(id, "challengeID", "UserDao");

  const collection = await getCollection("users");
  const aggregateArr = [
    {
      $match: {
        "challengeDetails.ID": challengeObjectID,
        showOnLeaderboard: true,
        banned: { $ne: true },
      },
    },
    {
      $project: {
        username: 1,
        challengeDetails: {
          $filter: {
            input: "$challengeDetails",
            as: "details",
            cond: { $eq: ["$$details.ID", challengeObjectID] },
          },
        },
      },
    },
    { $unwind: "$challengeDetails" },
    {
      $group: {
        _id: "$_id",
        username: { $first: "$username" },
        pb: { $first: "$challengeDetails.pb" },
        runID: { $first: "$challengeDetails.pbRunID" },
      },
    },
    { $sort: { pb: -1, runID: 1 } },
  ];
  if (recordCount) aggregateArr.push({ $limit: recordCount });

  const result = await collection.aggregate(aggregateArr).toArray();

  return result;
};

const isUserBanned = async id => {
  const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection.findOne({ _id: userObjectID }, { projection: { banned: 1 } });

  if (result.banned === true) return true;
  return false;
};

const isUserAdmin = async id => {
  const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection.findOne({ _id: userObjectID }, { projection: { admin: 1 } });

  if (result.admin === true) return true;
  return false;
};

const getUsernameByID = async id => {
  const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection.findOne({ _id: userObjectID }, { projection: { username: 1 } });
  return result.username;
};

const getPlayerCountByChallengeID = async id => {
  const challengeObjectID = TryParseObjectID(id, "ChallengeID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection
    .find({ "challengeDetails.ID": challengeObjectID, showOnLeaderboard: true })
    .count();

  return result;
};

const shouldShowUserOnLeaderboard = async id => {
  const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID },
    { projection: { showOnLeaderboard: 1 } }
  );

  if (result.showOnLeaderboard === true) return true;
  return false;
};

const getUserBadgesByID = async id => {
  const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection.findOne({ _id: userObjectID }, { projection: { badges: 1 } });
  if (!result || !result.badges) return [];
  else
    return result.badges.map(badge => {
      return {
        name: badge.name,
        color: badge.color,
        icon: badge.icon,
        backgroundColor: badge.backgroundColor,
        value: badge.value,
      };
    });
};

const getUserDetailsByID = async id => {
  const userObjectID = TryParseObjectID(id, "UserID", "UserDao");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID },
    { projection: { username: 1, "registrationData.date": 1 } }
  );

  if (!result) return null;
  const toReturn = {
    username: result.username,
  };
  if (result.registrationData) toReturn.joinDate = result.registrationData.date;
  else toReturn.joinDate = false;
  return toReturn;
};

const addBadgeToUser = async (userID, badgeData) => {
  const userObjectID = TryParseObjectID(userID, "UserID", "UserDao");

  const collection = await getCollection("users");
  await collection.updateOne(
    { _id: userObjectID },
    {
      $push: {
        badges: {
          ...badgeData,
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
  getUserPBs,
  getPRRunIDByChallengeID,
  getLeaderboardByChallengeId,
  isUserBanned,
  isUserAdmin,
  getUsernameByID,
  getPlayerCountByChallengeID,
  shouldShowUserOnLeaderboard,
  getUserBadgesByID,
  addBadgeToUser,
  getUserDetailsByID,
};
