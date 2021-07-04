const { Connection } = require("./MongoClient");
const Mongo = require("mongodb");

const getCollection = async (collection) => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const submitRun = async (runData) => {
  if (runData.userID) {
    runData.userID = new Mongo.ObjectID(runData.userID);
  }
  if (runData.challengeID) {
    runData.challengeID = new Mongo.ObjectID(runData.challengeID);
  }
  const collection = await getCollection("runs");
  const result = await collection.insertOne(runData);
  return result.ops[0]._id;
};

const getChallengePBByUser = async (userID, challengeID) => {
  const userObjectID = new Mongo.ObjectID(userID);
  const challengeObjectID = new Mongo.ObjectID(challengeID);
  const collection = await getCollection("runs");
  const result = await collection.findOne(
    {
      userID: userObjectID,
      challengeID: challengeObjectID,
    },
    {
      sort: { score: -1 },
      projection: { score: 1 },
    }
  );
  if (result === null) return null;
  return result.score;
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

const getChallengeByChallengeId = async (id) => {
  let objectID;
  try {
    objectID = new Mongo.ObjectID(id);
  } catch (e) {
    console.log("Bad challenge ID passed in:", id);
    return false;
  }
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

module.exports = {
  submitRun,
  getActiveChallenges,
  getChallengeByChallengeId,
  getChallengePBByUser,
};
