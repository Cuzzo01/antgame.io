const Connection = require("./MongoClient");
const Mongo = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

//#region Stats
const getUserLoginCount = async hoursBack => {
  const collection = await getCollection("users");
  const result = await collection
    .find({
      "loginRecords.time": { $gt: new Date(Date.now() - hoursBack * 60 * 60 * 1000) },
    })
    .count();
  return { hours: hoursBack, users: result };
};

const getNewAccountCount = async hoursBack => {
  const collection = await getCollection("users");
  const result = await collection
    .find({
      "registrationData.date": { $gt: new Date(Date.now() - hoursBack * 60 * 60 * 1000) },
    })
    .count();
  return { hours: hoursBack, newAccounts: result };
};
//#endregion Stats

//#region Configs
const getConfigListFromDB = async () => {
  const collection = await getCollection("configs");
  const result = await collection
    .find(
      {},
      {
        projection: {
          name: 1,
          seconds: 1,
          active: 1,
          record: { $first: "$records" },
          order: 1,
          homeLimit: 1,
        },
      }
    )
    .sort({ order: 1 })
    .toArray();
  return result;
};

const getConfigDetailsByID = async id => {
  const configObjectID = TryParseObjectID(id, "ChallengeID");

  const collection = await getCollection("configs");
  const result = await collection.findOne(
    { _id: configObjectID },
    {
      projection: {
        mapPath: 1,
        seconds: 1,
        homeLimit: 1,
        name: 1,
        order: 1,
        seconds: 1,
        records: 1,
        active: 1,
      },
    }
  );
  return result;
};

const updateConfigByID = async (id, updateObject) => {
  const configObjectID = TryParseObjectID(id, "ChallengeID");

  const collection = await getCollection("configs");
  const result = await collection.updateOne({ _id: configObjectID }, { $set: updateObject });

  return true;
};

const addNewConfig = async config => {
  const collection = await getCollection("configs");
  const result = await collection.insertOne(config);
  return result.ops[0];
};
//#endregion Configs

//#region Users
const getRecentlyCreatedUsers = async count => {
  const collection = await getCollection("users");
  const result = await collection
    .find({}, { projection: { username: 1, registrationData: 1, banned: 1 } })
    .sort({ "registrationData.date": -1 })
    .limit(count)
    .toArray();
  return result;
};

const getRecentlyLoggedInUsers = async count => {
  const collection = await getCollection("users");
  const result = await collection
    .find({}, { projection: { username: 1, loginRecord: { $first: "$loginRecords" } } })
    .sort({ "loginRecords.0.time": -1 })
    .limit(count)
    .toArray();
  return result;
};

const getUserDetailsByID = async id => {
  const userObjectID = TryParseObjectID(id, "UserID");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID },
    {
      projection: UserDetailsProjection,
    }
  );

  return result;
};

const updateUserByID = async (id, updateObject) => {
  const userObjectID = TryParseObjectID(id, "UserID");

  const collection = await getCollection("users");
  const result = await collection.findOneAndUpdate(
    { _id: userObjectID },
    { $set: updateObject },
    { projection: UserDetailsProjection, returnDocument: "after" }
  );

  return result.value;
};

const UserDetailsProjection = {
  username: 1,
  loginRecords: 1,
  admin: 1,
  showOnLeaderboard: 1,
  banned: 1,
  registrationData: 1,
  email: 1,
};

//#endregion Users

//#region Runs
const getRecentRuns = async count => {
  const collection = await getCollection("runs");
  const result = await collection
    .find(
      {},
      { projection: { submissionTime: 1, name: 1, userID: 1, score: 1, challengeID: 1, tags: 1 } }
    )
    .sort({ submissionTime: -1 })
    .limit(count)
    .toArray();
  return result;
};
//#endregion Runs

module.exports = {
  getUserLoginCount,
  getNewAccountCount,
  getConfigListFromDB,
  getConfigDetailsByID,
  updateConfigByID,
  addNewConfig,
  getRecentlyCreatedUsers,
  getRecentlyLoggedInUsers,
  getUserDetailsByID,
  updateUserByID,
  getRecentRuns,
};

const TryParseObjectID = (stringID, name) => {
  try {
    return new Mongo.ObjectID(stringID);
  } catch (e) {
    throw `Threw on ${name} parsing in Admin: ${stringID}`;
  }
};
