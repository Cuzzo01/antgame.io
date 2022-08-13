const { ObjectID } = require("mongodb");

const TryParseObjectID = (stringID, name, location = "") => {
  try {
    return new ObjectID(stringID);
  } catch (e) {
    throw `Threw on ${name} parsing in ${location}: ${stringID}`;
  }
};

module.exports = { TryParseObjectID };
