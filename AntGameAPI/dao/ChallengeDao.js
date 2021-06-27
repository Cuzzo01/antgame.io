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
  const result = await collection.find({ active: true });
  const activeConfigs = await result.toArray();
  const configToReturn = getRandomEntry(activeConfigs);
  return {
    mapPath: configToReturn.mapPath,
    time: configToReturn.time,
    homeLimit: configToReturn.homeLimit,
    name: configToReturn.name,
  };
};

const getRandomEntry = (list) => {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
};

module.exports = { submitRun, getChallenge };
