const Connection = require("./MongoClient");
const Mongo = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getChampionshipDetailsFromDB = async id => {
  const championshipObjectId = TryParseObjectID(id, "ChampionshipId");
  const collection = await getCollection("championships");
  const result = collection.findOne({ _id: championshipObjectId });
  return result;
};

const updateUserPointsTotal = async (championshipID, userID, pointsToAdd) => {
  const championshipObjectId = TryParseObjectID(championshipID, "ChampionshipId");
  const userObjectID = TryParseObjectID(userID, "UserID");

  const collection = await getCollection("championships");
  await collection.updateOne(
    { _id: championshipObjectId },
    { $inc: { "userPoints.$[user].points": pointsToAdd } },
    { arrayFilters: [{ "user.userID": userObjectID }] }
  );
};

const addUserToUserPoints = async (championshipID, userID, points) => {
  const championshipObjectId = TryParseObjectID(championshipID, "ChampionshipId");
  const userObjectID = TryParseObjectID(userID, "UserID");

  const collection = await getCollection("championships");
  await collection.updateOne(
    { _id: championshipObjectId },
    {
      $inc: { userCount: 1 },
      $push: {
        userPoints: {
          userID: userObjectID,
          points: points,
        },
      },
    }
  );
};

const addConfigIDToChampionship = async (championshipID, configID) => {
  const championshipObjectId = TryParseObjectID(championshipID, "ChampionshipId");
  const configObjectID = TryParseObjectID(configID, "ConfigID");

  const collection = await getCollection("championships");
  await collection.updateOne(
    { _id: championshipObjectId },
    {
      $push: {
        configs: configObjectID,
      },
    }
  );
};

const createNewChampionship = async ({ name, pointsMap }) => {
  const collection = await getCollection("championships");
  const result = await collection.insertOne({ name, pointsMap, userCount: 0 });
  return result.insertedId;
};

const getChampionshipIDByName = async name => {
  const collection = await getCollection("championships");
  const result = await collection.findOne({ name: name });
  if (!result) return null;
  return result._id;
};

const getLeaderboardByChampionshipID = async (ID, recordCount) => {
  const championshipObjectId = TryParseObjectID(ID, "ChampionshipID");

  const collection = await getCollection("championships");
  const result = await collection
    .aggregate([
      {
        $match: {
          _id: championshipObjectId,
        },
      },
      { $unwind: "$userPoints" },
      {
        $group: {
          _id: "$userPoints.userID",
          points: { $first: "$userPoints.points" },
        },
      },
      { $sort: { points: -1 } },
      { $limit: recordCount },
    ])
    .toArray();

  return result;
};

module.exports = {
  getChampionshipDetailsFromDB,
  updateUserPointsTotal,
  addUserToUserPoints,
  addConfigIDToChampionship,
  createNewChampionship,
  getChampionshipIDByName,
  getLeaderboardByChampionshipID,
};
const TryParseObjectID = (stringID, name) => {
  try {
    return new Mongo.ObjectID(stringID);
  } catch (e) {
    throw `Threw on ${name} parsing in ChampionshipDAO: ${stringID}`;
  }
};
