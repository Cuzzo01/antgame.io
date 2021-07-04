const { Connection } = require("../dao/MongoClient");

const getCollection = async (collection) => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getAuthDetailsByUsername = async (username) => {
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
  };
};

const IsUsernameTaken = async (username) => {
  const collection = await getCollection("users");
  const result = await collection.findOne({
    username_lower: username.toLowerCase(),
  });
  if (result === null) return false;
  return true;
};

const saveNewUser = async (userObject) => {
  const collection = await getCollection("users");
  const newUser = {
    username: userObject.username,
    username_lower: userObject.username.toLowerCase(),
    passHash: userObject.passHash,
    admin: userObject.admin,
  };
  return await collection.insertOne(newUser);
};

module.exports = { getAuthDetailsByUsername, IsUsernameTaken, saveNewUser };
