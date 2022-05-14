const { TryParseObjectID, getCollection } = require("./DaoHelpers");

const getChallengeDetailsByUser = async ({ userID, challengeID }) => {
  const userObjectID = TryParseObjectID(userID, "userId");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");

  const collection = await getCollection("users");
  const result = await collection.findOne(
    { _id: userObjectID, "challengeDetails.ID": challengeObjectID },
    { projection: { "challengeDetails.$": 1 } }
  );
  if (result === null) return null;
  return result.challengeDetails[0];
};

const updateChallengePB = async ({ userID, challengeID, score, runID }) => {
  const userObjectID = TryParseObjectID(userID, "userId");
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");
  const runObjectID = TryParseObjectID(runID, "runID");

  const collection = await getCollection("users");
  await collection.updateOne(
    { _id: userObjectID },
    {
      $set: {
        "challengeDetails.$[challenge].pb": score,
        "challengeDetails.$[challenge].pbRunID": runObjectID,
      },
    },
    {
      arrayFilters: [{ "challenge.ID": challengeObjectID }],
    }
  );
};
module.exports = { getChallengeDetailsByUser, updateChallengePB };
