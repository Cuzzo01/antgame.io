const { TryParseObjectID, getCollection } = require("./DaoHelpers");

const getRecordByChallenge = async ({ challengeID }) => {
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");

  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: challengeObjectID });
  if (result.records && result.records[0]) {
    return {
      score: result.records[0].score,
      username: result.records[0].username,
      id: result.records[0].userID,
      runId: result.records[0].runID,
    };
  } else return {};
};

const removeWorldRecord = async ({ challengeID, runID }) => {
  const challengeObjectID = TryParseObjectID(challengeID, "challengeID");
  const runObjectID = TryParseObjectID(runID, "RunID");

  const collection = await getCollection("configs");
  await collection.updateOne(
    { _id: challengeObjectID },
    { $pull: { records: { runID: runObjectID } } }
  );
};

const getChallengeDetailsByID = async ({ challengeID }) => {
  const configObjectID = TryParseObjectID(challengeID, "ChallengeID");

  const collection = await getCollection("configs");
  const result = await collection.findOne({ _id: configObjectID });
  return result;
};
module.exports = { getRecordByChallenge, removeWorldRecord, getChallengeDetailsByID };
