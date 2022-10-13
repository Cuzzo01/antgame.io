const Connection = require("./MongoClient");
const { TryParseObjectID } = require("./helpers");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getRunsByUserIdAndChallengeId = async ({ userId, challengeId, pageIndex, pageLength }) => {
  const challengeObjectID = TryParseObjectID(challengeId, "challengeID", "RunHistoryDao");
  const userObjectID = TryParseObjectID(userId, "userID", "RunHistoryDao");
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
    .limit(pageLength)
    .toArray();

  const runs = result?.map(runData => {
    return {
      homeLocations: runData.details.homeLocations,
      homeAmounts: runData.details.homeAmounts,
      seed: runData.details.seed,
      submissionTime: runData.submissionTime,
      score: runData.score,
      pr: runData.tagTypes?.includes("pr") ?? false,
    };
  });

  return { runs, pageLength };
};

module.exports = { getRunsByUserIdAndChallengeId };
