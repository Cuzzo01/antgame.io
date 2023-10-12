const Connection = require("./MongoClient");
const { TryParseObjectID } = require("./helpers");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

//#region Stats
const getUserLoginCount = async hoursBack => {
  const collection = await getCollection("users");
  const result = await collection.countDocuments({
    "loginRecords.time": { $gt: new Date(Date.now() - hoursBack * 60 * 60 * 1000) },
  });
  return { hours: hoursBack, value: result };
};

const getNewAccountCount = async hoursBack => {
  const collection = await getCollection("users");
  const result = await collection.countDocuments({
    "registrationData.date": { $gt: new Date(Date.now() - hoursBack * 60 * 60 * 1000) },
  });
  return { hours: hoursBack, value: result };
};

const getRunCount = async hoursBack => {
  const collection = await getCollection("runs");
  const result = await collection.countDocuments({
    submissionTime: { $gt: new Date(Date.now() - hoursBack * 60 * 60 * 1000) },
  });
  return { hours: hoursBack, value: result };
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
  const configObjectID = TryParseObjectID(id, "ChallengeID", "AdminDao");

  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: configObjectID });
  return result;
};

const updateConfigByID = async (id, updateObject) => {
  const configObjectID = TryParseObjectID(id, "ChallengeID", "AdminDao");

  const collection = await getCollection("configs");
  await collection.updateOne({ _id: configObjectID }, { $set: updateObject });

  return true;
};

const addNewConfig = async config => {
  const collection = await getCollection("configs");
  const result = await collection.insertOne(config);
  return result.insertedId;
};
//#endregion Configs

const getUserDetailsByID = async id => {
  const userObjectID = TryParseObjectID(id, "UserID", "AdminDao");

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
  const userObjectID = TryParseObjectID(id, "UserID", "AdminDao");

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
  banned: 1,
  registrationData: 1,
  email: 1,
  challengeDetails: 1,
  "banInfo.message": 1,
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
    .sort({ _id: -1 })
    .limit(count)
    .toArray();
  return result;
};

const getRunsByTag = async (tag, count) => {
  const collection = await getCollection("runs");
  const result = await collection
    .find(
      { "tags.type": tag },
      { projection: { submissionTime: 1, name: 1, userID: 1, score: 1, challengeID: 1, tags: 1 } }
    )
    .sort({ _id: -1 })
    .limit(count)
    .toArray();
  return result;
};

const getRunDetailsByID = async id => {
  const runObjectID = TryParseObjectID(id, "RunID", "AdminDao");

  const collection = await getCollection("runs");
  const result = await collection.findOne({ _id: runObjectID });

  return result;
};
//#endregion Runs

//#region championships
const getChampionshipListFromDB = async () => {
  const collection = await getCollection("championships");
  const result = await collection.find({}, { projection: { name: 1 } }).toArray();

  return result;
};
//#endregion championships

//#region Flags
async function getFlagListFromDB() {
  const collection = await getCollection("flags");

  const result = await collection
    .find({}, { projection: { name: 1, value: 1, type: 1 } })
    .sort({ name: 1 })
    .collation({ locale: "en", caseLevel: true })
    .toArray();
  return result;
}

async function getFlagDetailsByID(id) {
  const flagObjectID = TryParseObjectID(id, "FlagID", "AdminDao");

  const collection = await getCollection("flags");
  const result = await collection.findOne({ _id: flagObjectID });

  return result;
}

async function updateFlagByID(id, updateObject) {
  const flagObjectID = TryParseObjectID(id, "FlagID", "AdminDao");

  const collection = await getCollection("flags");
  const result = await collection.findOneAndUpdate(
    { _id: flagObjectID },
    { $set: updateObject },
    { projection: { name: 1, value: 1, type: 1 }, returnDocument: "after" }
  );

  return result.value;
}
//#endregion Flags

//#region ServiceTokens
async function saveNewServiceToken({ tokenHash, name, createdBy }) {
  const collection = await getCollection("serviceTokens");
  await collection.insertOne({ tokenHash, name, createdBy, createdOn: new Date() });
}
//#endregion ServiceTokens

module.exports = {
  getUserLoginCount,
  getNewAccountCount,
  getRunCount,
  getConfigListFromDB,
  getConfigDetailsByID,
  updateConfigByID,
  addNewConfig,
  getUserDetailsByID,
  updateUserByID,
  getRecentRuns,
  getRunsByTag,
  getRunDetailsByID,
  getChampionshipListFromDB,
  getFlagListFromDB,
  getFlagDetailsByID,
  updateFlagByID,
  saveNewServiceToken,
};
