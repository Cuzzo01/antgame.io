const Connection = require("./MongoClient");
const { FlagHandler } = require("../handler/FlagHandler");
const { TryParseObjectID } = require("./helpers");

const FlagCache = FlagHandler.getCache();

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getRunsByUserIdAndChallengeId = async ({ userId, challengeId, pageIndex }) => {
  const challengeObjectID = TryParseObjectID(challengeId, "challengeID", "RunHistoryDao");
  const userObjectID = TryParseObjectID(userId, "userID", "RunHistoryDao");
  const pageLength = await FlagCache.getIntFlag("batch-size.run-history");
  const recordsToSkip = pageLength * pageIndex;

  const collection = await getCollection("runs");

  const result = await collection
    .find(
      {
        userID: userObjectID,
        challengeID: challengeObjectID,
      },
      {
        projection: {
          details: {
            homeLocations: 1,
            homeAmounts: {
              $arrayElemAt: [{ $arrayElemAt: ["$details.snapshots", -1] }, 5],
            },
            seed: 1,
          },
          tagTypes: "$tags.type",
          score: 1,
          submissionTime: 1,
        },
      }
    )
    .sort({ submissionTime: -1 })
    .skip(recordsToSkip)
    .limit(pageLength + 1)
    .toArray();

  if (!result) return [];

  const reachedEndOfBatch = result.length < pageLength;
  if (!reachedEndOfBatch) {
    result.pop();
  }

  const runs = result.map(runData => {
    return {
      homeLocations: runData.details.homeLocations,
      homeAmounts: runData.details.homeAmounts,
      seed: runData.details.seed,
      submissionTime: runData.submissionTime,
      score: runData.score,
      pr: runData.tagTypes?.includes("pr") ?? false,
    };
  });

  return { runs, reachedEndOfBatch };
};

module.exports = { getRunsByUserIdAndChallengeId };
