const Connection = require("./MongoClient");
const { ObjectID } = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const TryParseObjectID = (stringID, name) => {
  try {
    return new ObjectID(stringID);
  } catch (e) {
    console.log(e);
    throw `Threw on ${name} parsing in MapDao: ${stringID}`;
  }
};
module.exports = { getCollection, TryParseObjectID };
