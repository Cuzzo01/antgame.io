const Connection = require("./MongoClient");
const Mongo = require("mongodb");
const { getGeneralizedTimeStringFromObjectID } = require("../helpers/TimeHelper");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const submitRun = async runData => {
  if (runData.userID) {
    let userObjectID = TryParseObjectID(runData.userID, "userID");
    runData.userID = userObjectID;
  }

  if (runData.challengeID) {
    let challengeObjectID = TryParseObjectID(runData.challengeID, "challengeID");
    runData.challengeID = challengeObjectID;
  }

  const collection = await getCollection("runs");
  const result = await collection.insertOne(runData);
  const runID = result.ops[0]._id;
  return runID;
};

const addTagToRun = async (id, tag) => {
  const runObjectID = TryParseObjectID(id, "RunID");

  const collection = await getCollection("runs");
  const result = await collection.updateOne(
    { _id: runObjectID },
    { $push: { tags: { $each: [tag] } } }
  );
  return;
};

const getRecordByChallenge = async challengeID => {
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");

  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: challengeObjectID });
  if (result.records && result.records[0]) {
    return {
      score: result.records[0].score,
      username: result.records[0].username,
    };
  } else return {};
};

const getRecordsByChallengeList = async challengeIDList => {
  let challengeObjectIDList = [];
  challengeIDList.forEach(id => {
    const parseResult = TryParseObjectID(id, "listChallengeID");
    challengeObjectIDList.push(parseResult);
  });

  const collection = await getCollection("configs");
  const result = await collection
    .find(
      { _id: { $in: challengeObjectIDList } },
      { projection: { _id: 1, records: { $slice: 1 }, record: 1 } }
    )
    .toArray();
  let records = {};
  result.forEach(challenge => {
    if (challenge.records) {
      const record = challenge.records[0];
      const timeString = getGeneralizedTimeStringFromObjectID(record.runID);
      records[challenge._id] = {
        wr: {
          score: record.score,
          username: record.username,
          age: timeString,
        },
      };
    } else {
      records[challenge._id] = {};
    }
  });
  return records;
};

const updateChallengeRecord = async (challengeID, score, username, userID, runID) => {
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");
  const userObjectID = TryParseObjectID(userID, "userID");
  const runObjectID = TryParseObjectID(runID, "runID");

  const collection = await getCollection("configs");
  const result = await collection.updateOne(
    { _id: challengeObjectID },
    {
      $push: {
        records: {
          $each: [
            {
              score: score,
              username: username,
              userID: userObjectID,
              runID: runObjectID,
            },
          ],
          $sort: {
            score: -1,
          },
        },
      },
    }
  );
};

const getActiveChallenges = async () => {
  const collection = await getCollection("configs");
  const result = await collection.find({ active: true }).sort({ order: 1 });
  const activeConfigs = await result.toArray();
  let challengeList = [];
  activeConfigs.forEach(config => {
    challengeList.push({
      name: config.name,
      id: config._id,
      thumbnailURL: config.thumbnailURL,
      time: config.seconds,
      homes: config.homeLimit,
      dailyChallenge: config.dailyChallenge,
    });
  });
  return challengeList;
};

const getChallengeByChallengeId = async id => {
  const challengeObjectID = TryParseObjectID(id);
  if (!challengeObjectID) {
    console.log("Bad challenge ID passed in:", id);
    return false;
  }
  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: challengeObjectID });
  if (result === null) return null;
  return {
    id: result._id,
    mapPath: result.mapPath,
    seconds: result.seconds,
    homeLimit: result.homeLimit,
    name: result.name,
    active: result.active,
    tournamentID: result.tournamentID,
    pointsAwarded: result.pointsAwarded,
  };
};

const getRunHomePositionsByRunId = async id => {
  const runObjectID = TryParseObjectID(id);

  const collection = await getCollection("runs");
  const result = await collection.findOne(
    { _id: runObjectID },
    {
      projection: {
        details: {
          homeLocations: 1,
          food: {
            $arrayElemAt: ["$details.snapshots", -1],
          },
        },
      },
    }
  );
  if (!result) return null;
  return { locations: result.details.homeLocations, amounts: result.details.food[5] };
};

const getMostRecentDailyChallenge = async () => {
  const collection = await getCollection("configs");
  const result = await collection
    .find(
      {
        dailyChallenge: true,
      },
      { projection: { _id: 1 } }
    )
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  return result[0];
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
  addTagToRun,
  getActiveChallenges,
  getChallengeByChallengeId,
  getRecordByChallenge,
  updateChallengeRecord,
  getRecordsByChallengeList,
  getRunHomePositionsByRunId,
  getMostRecentDailyChallenge,
};
