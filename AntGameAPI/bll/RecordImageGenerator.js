const { getConfigDetailsByID } = require("../dao/AdminDao");
const MapHandler = require("../handler/MapHandler");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");
const axios = require("axios");
const { getRunHomePositionsByRunId } = require("../dao/ChallengeDao");
const { CreateRecordImage } = require("../helpers/MapDrawer");
const { CountOnMap } = require("../MapGenerator/Helpers");
const { GenerateFoodTooltips } = require("../MapGenerator/FoodTooltipGenerator");
const SpacesService = require("../services/SpacesService");
const fs = require("fs");

const imgWidth = 1000;
const FoodPerCell = 20;

const GenerateSolutionImage = async ({ challengeID }) => {
  const challengeDetails = await getConfigDetailsByID(challengeID);
  if (challengeDetails === null) throw `Unable to pull challenge by ID : ${challengeID}`;

  const WR = challengeDetails.records[0];
  const mapID = challengeDetails.mapID;
  const configMapPath = challengeDetails.mapPath;
  const challengeName = challengeDetails.name;

  let mapPath = "";
  if (mapID) {
    mapPath = (await MapHandler.getMapData({ mapID })).url;
    mapPath = `https://antgame.nyc3.digitaloceanspaces.com/${mapPath}`;
  } else mapPath = configMapPath;
  const mapObject = await axios
    .get(mapPath)
    .then(res => res.data)
    .catch(err => {
      throw `threw on fetching map, ${err}`;
    });

  const mapData = mapObject.Map;

  const homeLocations = await getRunHomePositionsByRunId(WR.runID);
  homeLocations.locations.forEach(location => {
    mapData[location[0]][location[1]] = "h";
  });

  let totalFood;
  if (mapObject.FoodCount) totalFood = mapObject.FoodCount;
  else totalFood = CountOnMap("f", mapData);
  totalFood *= FoodPerCell;

  let homeAmounts = [];
  for (const [locationString, value] of Object.entries(homeLocations.amounts)) {
    const posList = locationString.split(",").map(pos => parseInt(pos));

    const score = Math.round((value / totalFood) * 100000);
    homeAmounts.push({
      x: posList[0],
      y: posList[1],
      value: score,
    });
  }

  const wrUsername = await ObjectIDToNameHandler.getUsername(WR.userID);
  const attributeTag = `${wrUsername} - ${WR.score} (World Record)`;
  let foodAmounts;
  if (mapObject.Tooltips) foodAmounts = mapObject.Tooltips;
  else foodAmounts = GenerateFoodTooltips(mapData);

  const diskPathToImage = await CreateRecordImage({
    mapData,
    imgWidth,
    homeAmounts,
    foodAmounts,
    challengeName: challengeName,
    attributeTag,
  });

  const pathName = await SpacesService.uploadRecordImage(
    challengeName,
    fs.readFileSync(diskPathToImage)
  );

  fs.unlinkSync(diskPathToImage);

  return pathName;
};

module.exports = { GenerateSolutionImage };
