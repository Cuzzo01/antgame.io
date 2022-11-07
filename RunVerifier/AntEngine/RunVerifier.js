const { default: axios } = require("axios");
const { getChallengeDetailsByID } = require("../dao/ChallengeDao");
const MapHandler = require("../handler/MapHandler");
const { GenerateRecordImage } = require("../service/AntGameApi");
const { GameRunner } = require("./GameRunner");

const VerifyRun = async ({ run }) => {
  const challengeDetails = await getChallengeDetailsByID({ challengeID: run.challengeID });

  let mapURL;
  if (challengeDetails.mapID) {
    const mapInfo = await MapHandler.getMapData({ mapID: challengeDetails.mapID.toString() });
    mapURL = `http://antgame.io/assets/${mapInfo.url}`;
  } else {
    mapURL = challengeDetails.mapPath;
  }

  const mapData = (await axios.get(mapURL)).data.Map;

  const homeLocations = run.details.homeLocations;
  for (let i = 0; i < homeLocations.length; i++) {
    const location = homeLocations[i];
    if (mapData[location[0]][location[1]] !== " ") {
      return { passedVerification: false, reason: "Homes placed in non-empty cells" };
    }
  }

  const { score: simulatedScore, foodEaten } = GameRunner.SimulateRun({
    mapData,
    homeLocations: run.details.homeLocations,
    seed: run.details.seed,
    time: challengeDetails.seconds,
    compatibilityDate: run.details.compatibilityDate ?? null,
  });

  const isWrRun = run.tags.findIndex(t => t.type === "wr") > -1;
  const isDaily = challengeDetails.dailyChallenge === true;
  if (isWrRun && isDaily) GenerateRecordImage({ runID: run._id, foodEaten });

  const passedVerification = simulatedScore === run.score;
  if (passedVerification) return { passedVerification };
  else return { passedVerification, reason: "simulated score did not match" };
};
module.exports = { VerifyRun };
