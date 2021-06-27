const { MongoClient } = require("mongodb");
const { Connection } = require("./MongoClient");

const getCollection = async (collection) => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const submitRun = async (runData) => {
  const collection = await getCollection("runs");
  const result = await collection.insertOne(runData);
};

const getChallenge = async () => {
  const collection = await getCollection("configs");
  const result = await collection.find({ active: true }).sort({ version: -1 });
  const activeConfigs = await result.toArray();
  const configToReturn = activeConfigs[0];
  return {
    mapPath: configToReturn.mapPath,
    time: configToReturn.time,
    homeLimit: configToReturn.homeLimit,
    name: configToReturn.name,
  };
};

module.exports = { submitRun, getChallenge };
