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
  await collection.updateOne({ _id: runObjectID }, { $push: { tags: { $each: [tag] } } });
};

const getRecordByChallenge = async challengeID => {
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");

  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: challengeObjectID });
  if (result.records && result.records[0]) {
    return {
      score: result.records[0].score,
      username: result.records[0].username,
      id: result.records[0].userID,
      runId: result.records[0].runID,
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
    if (challenge.records && challenge.records.length) {
      const record = challenge.records[0];
      const timeString = getGeneralizedTimeStringFromObjectID(record.runID);
      records[challenge._id] = {
        id: record.userID,
        score: record.score,
        username: record.username,
        age: timeString,
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
  await collection.updateOne(
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
      championshipID: config.championshipID,
    });
  });
  return challengeList;
};

const getChallengeByChallengeId = async id => {
  const challengeObjectID = TryParseObjectID(id);
  if (!challengeObjectID) {
    return false;
  }
  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: challengeObjectID });
  if (result === null) return null;
  return {
    id: result._id,
    mapPath: result.mapPath,
    mapID: result.mapID,
    seconds: result.seconds,
    homeLimit: result.homeLimit,
    name: result.name,
    active: result.active,
    championshipID: result.championshipID,
    pointsAwarded: result.pointsAwarded,
    dailyChallenge: result.dailyChallenge,
    solutionImage: result.solutionImage,
  };
};

const getRunDataByRunId = async id => {
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
          solutionImage: 1,
        },
        tags: 1,
        challengeID: 1,
        userID: 1,
        score: 1,
      },
    }
  );
  if (!result) return null;

  const prTag = result.tags.find(t => t.type === "pr");
  let runNumber;
  if (prTag) {
    runNumber = prTag.metadata.runNumber;
  }

  return {
    homeLocations: result.details.homeLocations,
    homeAmounts: result.details.food[5],
    challengeID: result.challengeID,
    userID: result.userID,
    score: result.score,
    solutionImage: result.details.solutionImage,
    runNumber,
  };
};

const getDailyChallengesInReverseOrder = async ({ limit = 0, skip = 0 }) => {
  const collection = await getCollection("configs");
  const result = await collection
    .find(
      {
        dailyChallenge: true,
      },
      { projection: { _id: 1, name: 1, championshipID: 1 } }
    )
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return result;
};

const addChampionshipIDToConfig = async (configID, championshipID) => {
  const configObjectID = TryParseObjectID(configID, "ConfigID");
  const championshipObjectId = TryParseObjectID(championshipID, "ChampionshipId");

  const collection = await getCollection("configs");
  await collection.updateOne(
    { _id: configObjectID },
    {
      $set: {
        championshipID: championshipObjectId,
      },
    }
  );
};

const markRunForVerification = async ({ runID, priority = 10 }) => {
  const runObjectID = TryParseObjectID(runID, "RunID");

  const collection = await getCollection("runs");
  await collection.updateOne(
    { _id: runObjectID },
    { $set: { toVerify: true, "verification.priority": priority } }
  );
};

const addSolutionImageToRun = async ({ runID, imagePath }) => {
  const runObjectID = TryParseObjectID(runID, "RunID");

  const collection = await getCollection("runs");
  await collection.updateOne(
    { _id: runObjectID },
    { $set: { "details.solutionImage": imagePath } }
  );
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
  getRunDataByRunId,
  getDailyChallengesInReverseOrder,
  addChampionshipIDToConfig,
  markRunForVerification,
  addSolutionImageToRun,
};
