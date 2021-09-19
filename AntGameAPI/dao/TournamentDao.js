const Connection = require("./MongoClient");
const Mongo = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getTournamentDetails = async id => {
  const tournamentObjectId = TryParseObjectID(id, "TournamentID");
  const collection = await getCollection("tournaments");
  const result = collection.findOne({ _id: tournamentObjectId });
  return result;
};

const updateUserPointsTotal = async (tournamentID, userID, pointsToAdd) => {
  const tournamentObjectId = TryParseObjectID(tournamentID, "TournamentID");
  const userObjectID = TryParseObjectID(userID, "UserID");

  const collection = await getCollection("tournaments");
  const result = await collection.updateOne(
    { _id: tournamentObjectId },
    { $inc: { "userPoints.$[user].points": pointsToAdd } },
    { arrayFilters: [{ "user.userID": userObjectID }] }
  );
};

const addUserToUserPoints = async (tournamentID, userID, points) => {
  const tournamentObjectId = TryParseObjectID(tournamentID, "TournamentID");
  const userObjectID = TryParseObjectID(userID, "UserID");

  const collection = await getCollection("tournaments");
  const result = await collection.updateOne(
    { _id: tournamentObjectId },
    {
      $push: {
        userPoints: {
          userID: userObjectID,
          points: points,
        },
      },
    }
  );
};

module.exports = { getTournamentDetails, updateUserPointsTotal, addUserToUserPoints };

const TryParseObjectID = (stringID, name) => {
  try {
    return new Mongo.ObjectID(stringID);
  } catch (e) {
    throw `Threw on ${name} parsing in TournamentDAO: ${stringID}`;
  }
};
