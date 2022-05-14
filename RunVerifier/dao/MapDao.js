const { getCollection, TryParseObjectID } = require("./DaoHelpers");

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

const getMapByName = async ({ name }) => {
  const collection = await getCollection("maps");
  const result = await collection.findOne({ name: name });
  return result;
};
module.exports = { addMapToDB, getMapByID, getMapByName };
