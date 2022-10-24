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
  const collection = await getCollection("runs-to-verify");
  const result = await collection.findOneAndUpdate(
    { startTime: null },
    { $set: { startTime: new Date() } },
    { sort: { priority: 1 } }
  );

  if (!result.value) return null;
  const verifyInfo = result.value;

  const runsCollection = await getCollection("runs");
  return runsCollection.findOne({ _id: verifyInfo.runId });
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

  const collection = await getCollection("runs-to-verify");
  const result = await collection.findOneAndDelete({ runId: runObjectID });
  const verifyInfo = result.value;

  const runsCollection = await getCollection("runs");
  await runsCollection.updateOne(
    { _id: runObjectID },
    {
      $unset: { toVerify: "" },
      $set: {
        verification: {
          finishTime: new Date(),
          startTime: verifyInfo.startTime,
        },
      },
    }
  );
};

const fixOrphanedRuns = async ({ cutoffTime }) => {
  const collection = await getCollection("runs-to-verify");
  const result = await collection.updateMany(
    { startTime: { $lt: cutoffTime } },
    { $unset: { startTime: null }, $inc: { resets: 1 } }
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
