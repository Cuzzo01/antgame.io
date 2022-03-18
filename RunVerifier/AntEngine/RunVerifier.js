const { default: axios } = require("axios");
const { getChallengeDetailsByID } = require("../dao/Dao");
const MapHandler = require("../handler/MapHandler");
const { GameRunner } = require("./GameRunner");

const VerifyRun = async ({ run }) => {
  const challengeDetails = await getChallengeDetailsByID({ challengeID: run.challengeID });

  let mapURL;
  if (challengeDetails.mapID) {
    const mapInfo = await MapHandler.getMapData({ mapID: challengeDetails.mapID.toString() });
    mapURL = `http://antgame.io/asset/${mapInfo.url}`;
  } else {
    mapURL = challengeDetails.mapPath;
  }

  const mapData = (await axios.get(mapURL)).data.Map;

  const simulatedScore = GameRunner.SimulateRun({
    mapData,
    homeLocations: run.details.homeLocations,
    seed: run.details.seed,
    time: challengeDetails.seconds,
  });
  return simulatedScore === run.score;
};
module.exports = { VerifyRun };
