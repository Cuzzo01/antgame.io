const { Connection } = require("./MongoClient");
const Mongo = require("mongodb");

const getCollection = async (collection) => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const submitRun = async (runData) => {
  if (runData.userID) {
    let userObjectID = TryParseObjectID(runData.userID, "userID");

    runData.userID = userObjectID;
  }
  if (runData.challengeID) {
    let challengeObjectID = TryParseObjectID(
      runData.challengeID,
      "challengeID"
    );

    runData.challengeID = challengeObjectID;
  }
  const collection = await getCollection("runs");
  const result = await collection.insertOne(runData);
  const runID = result.ops[0]._id;
  return runID;
};

// const getChallengePBByUser = async (userID, challengeID) => {
//   const userObjectID = new Mongo.ObjectID(userID);
//   const challengeObjectID = new Mongo.ObjectID(challengeID);
//   const collection = await getCollection("runs");
//   const result = await collection.findOne(
//     {
//       userID: userObjectID,
//       challengeID: challengeObjectID,
//     },
//     {
//       sort: { score: -1 },
//       projection: { score: 1 },
//     }
//   );
//   if (result === null) return null;
//   return result.score;
// };

const getRecordByChallenge = async (challengeID) => {
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");

  collection = await getCollection("configs");
  const result = await collection.findOne({ _id: challengeObjectID });
  return result.record ?? {};
};

const updateChallengeRecord = async (
  challengeID,
  score,
  username,
  userID,
  runID
) => {
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");
  const userObjectID = TryParseObjectID(userID, "userID");
  const runObjectID = TryParseObjectID(runID, "runID");

  collection = await getCollection("configs");
  const result = await collection.updateOne(
    { _id: challengeObjectID },
    {
      $set: {
        record: {
          score: score,
          username: username,
          userID: userObjectID,
          runID: runObjectID,
        },
      },
    }
  );
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
  const challengeObjectID = TryParseObjectID(id);
  if (!challengeObjectID) {
    console.log("Bad challenge ID passed in:", id);
    return false;
  }
  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: challengeObjectID });
  return {
    id: result._id,
    mapPath: result.mapPath,
    time: result.time,
    homeLimit: result.homeLimit,
    name: result.name,
  };
};

const TryParseObjectID = (stringID, name) => {
  try {
    return new Mongo.ObjectID(stringID);
  } catch (e) {
    if (name) throw `Threw on ${name} parsing in ChallengeDao: ${stringID}`;
    else return false;
  }
};

module.exports = {
  submitRun,
  getActiveChallenges,
  getChallengeByChallengeId,
  getRecordByChallenge,
  updateChallengeRecord,
  // getChallengePBByUser,
};
