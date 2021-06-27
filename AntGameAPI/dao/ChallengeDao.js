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

module.exports = { submitRun };
