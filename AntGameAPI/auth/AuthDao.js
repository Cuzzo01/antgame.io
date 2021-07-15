const { Connection } = require("../dao/MongoClient");
const { ObjectID } = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getAuthDetailsByUsername = async username => {
  const collection = await getCollection("users");
  const result = await collection.findOne({
    username_lower: username.toLowerCase(),
  });
  if (result === null) return false;
  return {
    id: result._id,
    username: result.username,
    passHash: result.passHash,
    admin: result.admin,
    showOnLeaderboard: result.showOnLeaderboard,
  };
};

const IsUsernameTaken = async username => {
  const collection = await getCollection("users");
  const result = await collection.findOne({
    username_lower: username.toLowerCase(),
  });
  if (result === null) return false;
  return true;
};

const saveNewUser = async userObject => {
  const collection = await getCollection("users");
  const newUser = {
    username: userObject.username,
    username_lower: userObject.username.toLowerCase(),
    passHash: userObject.passHash,
    admin: userObject.admin,
    challengeDetails: [],
    showOnLeaderboard: true,
  };
  return await collection.insertOne(newUser);
};

const logLogin = async (userID, IPAddress, clientID) => {
  const userObjectID = TryParseObjectID(userID, "userID");
  const collection = await getCollection("users");
  const result = await collection.updateOne(
    { _id: userObjectID },
    {
      $push: {
        loginRecords: {
          IP: IPAddress,
          clientID: clientID,
          time: new Date(),
        },
      },
    }
  );
};

const TryParseObjectID = (stringID, name) => {
  try {
    return new ObjectID(stringID);
  } catch (e) {
    throw `Threw on ${name} parsing in AuthDao: ${stringID}`;
  }
};

module.exports = { getAuthDetailsByUsername, IsUsernameTaken, saveNewUser, logLogin };
