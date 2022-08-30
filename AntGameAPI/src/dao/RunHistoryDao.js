const Connection = require("./MongoClient");
const { TryParseObjectID } = require("./helpers");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const getRunsByUserIdAndChallengeId = async ({ userId, challengeId, timeBefore, itemsToGrab} ) => {

    const challengeObjectID = TryParseObjectID(challengeId, "challengeID", "RunHistoryDao");
    const userObjectID = TryParseObjectID(userId, "userID", "RunHistoryDao");
    const date = new Date(timeBefore);
  
    const collection = await getCollection("runs");

    const result = await collection
    .find({
      userID: userObjectID,
      challengeID: challengeObjectID,
      submissionTime: { $lt: date },
    },
    {
        projection: {
          details: {
            homeLocations: 1,
            food: {
              $arrayElemAt: ["$details.snapshots", -1],
            },
          },
          tags: 1,
          score: 1,
          submissionTime: 1,
        },
      })
    .sort({ submissionTime: -1 })
    .limit(itemsToGrab)
    .toArray();
   
    if (!result) return [];

    return result.map( runData => {
        try{
            if(!runData.details.homeLocations || !runData.details.food[5]){
                throw new Error();
            }
            return {
                homeLocations: runData.details.homeLocations,
                homeAmounts: runData.details.food[5],
                submissionTime: runData.submissionTime,
                score!: runData.score,
                types: runData.tags.map(t => {
                    if(t.type === "pr" || t.type === "wr"){
                        return t.type;
                    }
                    return null;
                }).filter(t => t)
            }
        } catch {
            return null;
        }
    }).filter(t => t !== null)
  };
  
module.exports = { getRunsByUserIdAndChallengeId };