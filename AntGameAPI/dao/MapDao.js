const Connection = require("./MongoClient");
const { ObjectID } = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const addMapToDB = async ({ url, name, foodCount }) => {
  const collection = await getCollection("maps");
  const result = await collection.insertOne({ url, name, foodCount });
  return result.ops[0];
};

const getMapByID = async ({ mapID }) => {
  const mapObjectID = TryParseObjectID(mapID, "MapID");

  const collection = await getCollection("maps");
  const result = await collection.findOne({ _id: mapObjectID });
  return result;
};

const TryParseObjectID = (stringID, name) => {
  try {
    return new ObjectID(stringID);
  } catch (e) {
    console.log(e);
    throw `Threw on ${name} parsing in UserDao: ${stringID}`;
  }
};

module.exports = { addMapToDB, getMapByID };
