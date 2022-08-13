const { getConfigDetailsByID } = require("../dao/AdminDao");
const MapHandler = require("../handler/MapHandler");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");
const axios = require("axios");
const { getRunDataByRunId } = require("../dao/ChallengeDao");
const { DrawMapImage } = require("../helpers/MapDrawer");
const { CountOnMap } = require("../MapGenerator/Helpers");
const { GenerateFoodTooltips } = require("../MapGenerator/FoodTooltipGenerator");
const SpacesService = require("../services/SpacesService");
const fs = require("fs");

const imgWidth = 1000;
const FoodPerCell = 20;

const GenerateSolutionImage = async ({ runID, foodEaten }) => {
  const runData = await getRunDataByRunId(runID);

  const challengeDetails = await getConfigDetailsByID(runData.challengeID);
  if (challengeDetails === null) throw `Unable to pull challenge by ID : ${runData.challengeID}`;

  const mapID = challengeDetails.mapID;
  const configMapPath = challengeDetails.mapPath;
  const challengeName = challengeDetails.name;

  let mapPath = "";
  if (mapID) {
    mapPath = (await MapHandler.getMapData({ mapID })).url;
    mapPath = `https://antgame.io/assets/${mapPath}`;
  } else mapPath = configMapPath;
  const mapObject = await axios
    .get(mapPath)
    .then(res => res.data)
    .catch(err => {
      throw `threw on fetching map, ${err}`;
    });

  const mapData = mapObject.Map;

  runData.homeLocations.forEach(location => {
    mapData[location[0]][location[1]] = "h";
  });

  if (foodEaten)
    foodEaten.forEach(location => {
      mapData[location[0]][location[1]] = "fe";
    });

  let totalFood;
  if (mapObject.FoodCount) totalFood = mapObject.FoodCount;
  else totalFood = CountOnMap("f", mapData);
  totalFood *= FoodPerCell;

  let homeAmounts = [];
  for (const [locationString, value] of Object.entries(runData.homeAmounts)) {
    const posList = locationString.split(",").map(pos => parseInt(pos));

    const score = Math.round((value / totalFood) * 100000);
    homeAmounts.push({
      x: posList[0],
      y: posList[1],
      value: score,
    });
  }

  const wrUsername = await ObjectIDToNameHandler.getUsername(runData.userID);
  const attributeTag = `${wrUsername} - ${runData.score}`;
  const runNumber = runData.runNumber;

  let foodAmounts;
  if (mapObject.Tooltips) foodAmounts = mapObject.Tooltips;
  else foodAmounts = GenerateFoodTooltips(mapData);

  const diskPathToImage = await DrawMapImage({
    mapData,
    imgWidth,
    homeAmounts,
    foodAmounts,
    challengeName: challengeName,
    attributeTag,
    runNumber,
  });

  const pathName = await SpacesService.uploadRecordImage({
    challengeName,
    image: fs.readFileSync(diskPathToImage),
    score: runData.score,
    username: wrUsername,
  });

  fs.unlinkSync(diskPathToImage);

  return pathName;
};

const GenerateMapThumbnail = async ({ mapData, challengeName }) => {
  const diskPathToImage = await DrawMapImage({
    imgWidth: 500,
    mapData,
    challengeName,
    isThumbnail: true,
  });

  const pathName = await SpacesService.uploadMapThumbnail({
    challengeName,
    image: fs.readFileSync(diskPathToImage),
  });

  fs.unlinkSync(diskPathToImage);

  return pathName;
};

module.exports = { GenerateSolutionImage, GenerateMapThumbnail };
