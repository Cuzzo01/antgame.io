const Connection = require("./MongoClient");
const Mongo = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getUsersLoggedIn = async hoursBack => {
  const collection = await getCollection("users");
  const result = await collection
    .find({
      "loginRecords.time": { $gt: new Date(Date.now() - hoursBack * 60 * 60 * 1000) },
    })
    .count();
  return { hours: hoursBack, users: result };
};

const getConfigListFromDB = async () => {
  const collection = await getCollection("configs");
  const result = await collection
    .find(
      {},
      { projection: { name: 1, seconds: 1, active: 1, record: { $first: "$records" }, order: 1, homeLimit: 1 } }
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
    { projection: { mapPath: 1, seconds: 1, homeLimit: 1, name: 1, order: 1, seconds: 1, records: 1, active: 1 } }
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

module.exports = { getUsersLoggedIn, getConfigListFromDB, getConfigDetailsByID, updateConfigByID, addNewConfig };

const TryParseObjectID = (stringID, name) => {
  try {
    return new Mongo.ObjectID(stringID);
  } catch (e) {
    throw `Threw on ${name} parsing in Admin: ${stringID}`;
  }
};
