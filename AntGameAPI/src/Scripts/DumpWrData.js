const { getRunDetailsByID } = require("../dao/AdminDao");
const {
  getDailyChallengesInReverseOrder,
  getChallengeByChallengeId,
  getRecordByChallenge,
} = require("../dao/ChallengeDao");
const { getMapByID } = require("../dao/MapDao");

const DumpWrData = async () => {
  const dataList = [];
  const result = await getDailyChallengesInReverseOrder({ limit: 30, skip: 14 });
  for (let i = 0; i < result.length; i++) {
    const challengeDetails = await getChallengeByChallengeId(result[i]._id);
    const wrData = await getRecordByChallenge(challengeDetails.id);
    const runData = await getRunDetailsByID(wrData.runId);
    let mapPath;
    if (challengeDetails.mapID) {
      const mapData = await getMapByID({ mapID: challengeDetails.mapID });
      mapPath = mapData.url;
    } else {
      mapPath = challengeDetails.mapPath;
    }
    const data = {
      map: mapPath,
      time: challengeDetails.seconds,
      score: wrData.score,
      homeLocations: runData.details.homeLocations,
      seed: runData.details.seed,
      name: challengeDetails.name,
    };
    dataList.push(data);
  }
  console.log(JSON.stringify(dataList));
  return dataList;
};

module.exports = { DumpWrData };
