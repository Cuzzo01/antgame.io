const { default: axios } = require("axios");
const { getChallengeDetailsByID } = require("../dao/Dao");
const MapHandler = require("../handler/MapHandler");
const { GameRunner } = require("./GameRunner");

const VerifyRun = async ({ run }) => {
  const challengeDetails = await getChallengeDetailsByID({ challengeID: run.challengeID });

  if (!challengeDetails.mapID) throw "tried to VerifyRun on config with no mapID";

  const mapInfo = await MapHandler.getMapData({ mapID: challengeDetails.mapID.toString() });
  const mapData = (await axios.get(`http://antgame.io/asset/${mapInfo.url}`)).data.Map;

  const simulatedScore = GameRunner.SimulateRun({
    mapData,
    homeLocations: run.details.homeLocations,
    seed: run.details.seed,
    time: challengeDetails.seconds,
  });
  return simulatedScore === run.score;
};
module.exports = { VerifyRun };
