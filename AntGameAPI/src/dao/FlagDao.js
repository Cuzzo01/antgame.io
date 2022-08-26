const Connection = require("./MongoClient");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getFlag = async name => {
  const collection = await getCollection("flags");
  const result = await collection.findOne({ name: name });
  if (result) return { value: result.value, bypassCache: result.bypassCache };
  throw `getFlag called with non-existent flag name : ${name}`;
};

module.exports = { getFlag };
