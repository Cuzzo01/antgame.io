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

const getRunToVerify = async () => {
  const collection = await getCollection("runs");
  const result = await collection.findOneAndUpdate(
    { toVerify: true, "verification.startTime": null },
    { $set: { "verification.startTime": new Date() } },
    { sort: { "verification.priority": 1 } }
  );
  return result.value;
};

const getRunDetailsByID = async ({ runID }) => {
  const runObjectID = TryParseObjectID(runID, "RunID");

  const collection = await getCollection("runs");
  const result = await collection.findOne({ _id: runObjectID });

  return result;
};

const addTagToRun = async ({ id, tag }) => {
  const runObjectID = TryParseObjectID(id, "RunID");

  const collection = await getCollection("runs");
  await collection.updateOne({ _id: runObjectID }, { $push: { tags: { $each: [tag] } } });
};

const unsetToVerifyFlagAndSetFinishTime = async ({ runID }) => {
  const runObjectID = TryParseObjectID(runID, "RunID");

  const collection = await getCollection("runs");
  await collection.updateOne(
    { _id: runObjectID },
    { $unset: { toVerify: "" }, $set: { "verification.finishTime": new Date() } }
  );
};

const fixOrphanedRuns = async ({ cutoffTime }) => {
  const collection = await getCollection("runs");
  const result = await collection.updateMany(
    {
      "verification.startTime": { $lt: cutoffTime },
      "verification.finishTime": null,
      toVerify: true,
    },
    { $unset: { "verification.startTime": null }, $inc: { "verification.resets": 1 } }
  );
  return result.modifiedCount;
};

module.exports = {
  getNewUserPB,
  getRunToVerify,
  getRunDetailsByID,
  addTagToRun,
  unsetToVerifyFlagAndSetFinishTime,
  fixOrphanedRuns,
};
