const Connection = require("./MongoClient");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const saveSeed = async ({ seed, userID, homeLocations, expiresAt }) => {
  const collection = await getCollection("seeds");
  try {
    await collection.insertOne({ seed, userID, homeLocations, expiresAt });
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
module.exports = { saveSeed, getSeedData, deleteSeed };
