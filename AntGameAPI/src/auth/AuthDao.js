const Connection = require("../dao/MongoClient");
const { TryParseObjectID } = require("../dao/helpers");

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
    banned: result.banned,
    banInfo: result.banInfo,
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
  let newUser = {
    username: userObject.username,
    username_lower: userObject.username.toLowerCase(),
    passHash: userObject.passHash,
    admin: userObject.admin,
    challengeDetails: [],
    showOnLeaderboard: true,
    registrationData: userObject.registrationData,
  };
  if (userObject.email.length > 0) newUser.email = userObject.email;
  const result = await collection.insertOne(newUser);
  return result.insertedId;
};

const logLogin = async (userID, IPAddress, clientID) => {
  const userObjectID = TryParseObjectID(userID, "userID", "AuthDao");
  const collection = await getCollection("users");
  await collection.updateOne(
    { _id: userObjectID },
    {
      $inc: { loginCount: 1 },
      $push: {
        loginRecords: {
          $each: [
            {
              IP: IPAddress,
              clientID: clientID,
              time: new Date(),
            },
          ],
          $sort: {
            time: -1,
          },
          $slice: 20,
        },
      },
    }
  );
};

const getServiceTokenData = async ({ serviceName }) => {
  const collection = await getCollection("serviceTokens");
  const result = await collection.findOne({ name: serviceName });
  if (result === null) return null;
  return { hash: result.tokenHash };
};

module.exports = {
  getAuthDetailsByUsername,
  IsUsernameTaken,
  saveNewUser,
  logLogin,
  getServiceTokenData,
};
