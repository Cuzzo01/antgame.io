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

const getRecordByChallenge = async (challengeID) => {
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");

  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: challengeObjectID });
  return result.record ? result.record : {};
};

const getRecordsByChallengeList = async (challengeIDList) => {
  let objectIDList = [];
  challengeIDList.forEach((id) => {
    const parseResult = TryParseObjectID(id, "listChallengeID");
    objectIDList.push(parseResult);
  });

  const collection = await getCollection("configs");
  const result = await collection
    .find(
      { _id: { $in: objectIDList } },
      { projection: { "record.score": 1, "record.username": 1 } }
    )
    .toArray();
  let records = {};
  result.forEach((record) => {
    records[record._id] = { wr: record.record };
  });
  return records;
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

const getLeaderboardByChallengeId = async (id) => {
  const challengeObjectID = TryParseObjectID(id, "challengeID");

  const collection = await getCollection("users");
  // FIXME: There has got to be a way to do the sort in Mongo, this is gross
  const result = await collection
    .find(
      { showOnLeaderboard: true, "challengeDetails.ID": challengeObjectID },
      { projection: { username: 1, "challengeDetails.$": 1 } }
    )
    .map((result) => {
      return {
        id: result._id,
        username: result.username,
        pb: result.challengeDetails[0].pb,
      };
    })
    .toArray();

  return result;
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
  getRecordsByChallengeList,
  getLeaderboardByChallengeId,
  // getChallengePBByUser,
};
