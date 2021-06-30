const { MongoClient } = require("mongodb");
const { Connection } = require("./MongoClient");
const Mongo = require("mongodb");

const getCollection = async (collection) => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const submitRun = async (runData) => {
  const collection = await getCollection("runs");
  const result = await collection.insertOne(runData);
};

const getActiveChallenges = async () => {
  const collection = await getCollection("configs");
  const result = await collection.find({ active: true });
  const activeConfigs = await result.toArray();
  let challengeList = [];
  activeConfigs.forEach((config) => {
    challengeList.push({
      name: config.name,
      id: config._id,
    });
  });
  return challengeList;
};

const getChallengeById = async (id) => {
  const objectID = new Mongo.ObjectID(id);
  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: objectID });
  return {
    id: result._id,
    mapPath: result.mapPath,
    time: result.time,
    homeLimit: result.homeLimit,
    name: result.name,
  };
};

module.exports = { submitRun, getActiveChallenges, getChallengeById };
