const Connection = require("./MongoClient");
const Logger = require("../Logger");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const removeAnonAndTagLessRunsOlderThan7Days = async () => {
  const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;

  const collection = await getCollection("runs");
  const result = await collection.deleteMany({
    userID: false,
    tags: [],
    submissionTime: { $lt: new Date(Date.now() - sevenDaysInMilliseconds) },
  });
  Logger.info({
    source: "removeAnonAndTagLessRunsOlderThan7Days",
    infoText: `cron deleted ${result.deletedCount} records`,
  });
};

module.exports = { removeAnonAndTagLessRunsOlderThan7Days };
