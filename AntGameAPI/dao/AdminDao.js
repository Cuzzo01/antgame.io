const { Connection } = require("./MongoClient");
const Mongo = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getUsersLoggedIn = async hoursBack => {
  const collection = await getCollection("users");
  const result = await collection
    .find({
      "loginRecords.time": { $gt: new Date(Date.now() - hoursBack * 60 * 60 * 1000) },
    })
    .count();
  return { hours: hoursBack, users: result };
};

module.exports = { getUsersLoggedIn };
