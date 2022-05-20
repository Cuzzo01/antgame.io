const { getCollection, TryParseObjectID } = require("./DaoHelpers");

const getNewUserPB = async ({ userID, challengeID, oldPBRunID }) => {
  const userObjectID = TryParseObjectID(userID, "userId");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");
  const runObjectID = TryParseObjectID(oldPBRunID, "RunID");

  const collection = await getCollection("runs");
  const result = await collection
    .find({
      _id: { $ne: runObjectID },
      userID: userObjectID,
      challengeID: challengeObjectID,
      "tags.type": "run verified",
    })
    .sort({ score: -1 })
    .limit(1)
    .toArray();

  if (result.length === 0) return null;
  return result[0];
};
module.exports = { getNewUserPB };