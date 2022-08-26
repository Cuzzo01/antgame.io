const { TryParseObjectID } = require("./helpers");
const Connection = require("./MongoClient");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const saveSeed = async ({ seed, userID, homeLocations, expiresAt }) => {
  const userObjectId = TryParseObjectID(userID, "UserID", "SeedDao");

  const collection = await getCollection("seeds");
  try {
    await collection.insertOne({ seed, userID: userObjectId, homeLocations, expiresAt });
    return true;
  } catch (e) {
    if (e.code === 11000) return false;
    throw e;
  }
};

const getSeedData = async ({ seed }) => {
  const collection = await getCollection("seeds");
  return await collection.findOne({ seed });
};

const deleteSeed = async ({ seed }) => {
  const collection = await getCollection("seeds");
  await collection.deleteOne({ seed });
};

const getOutstandingSeedCount = async ({ userID }) => {
  const userObjectId = TryParseObjectID(userID, "UserID", "SeedDao");

  const collection = await getCollection("seeds");
  return await collection.countDocuments({ userID: userObjectId });
};
module.exports = { saveSeed, getSeedData, deleteSeed, getOutstandingSeedCount };
