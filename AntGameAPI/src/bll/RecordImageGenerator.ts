import axios from "axios";
import fs from "fs";
import { getConfigDetailsByID } from "../dao/AdminDao";
import { getRunDataByRunId } from "../dao/ChallengeDao";
import { MapHandler } from "../handler/MapHandler";
import { ObjectIDToNameHandler } from "../handler/ObjectIDToNameHandler";
import { DrawMapImage } from "../helpers/MapDrawer";
import { GenerateFoodTooltips } from "../MapGenerator/FoodTooltipGenerator";
import { CountOnMap } from "../MapGenerator/Helpers";
import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { MapFile } from "../models/Maps/MapFile";
import { Tooltip } from "../models/Maps/Tooltip";
import { RunData } from "../models/RunData";
import { SpacesServiceProvider } from "../services/SpacesService";

const imgWidth = 1000;
const FoodPerCell = 20;

const MapCache = MapHandler.getCache();
const ObjectIDToNameCache = ObjectIDToNameHandler.getCache();
const SpacesService = SpacesServiceProvider.getService();

export const GenerateSolutionImage = async (p: { runID: string; foodEaten?: number[][] }) => {
  const runData = (await getRunDataByRunId(p.runID)) as RunData;

  const challengeDetails = (await getConfigDetailsByID(runData.challengeID)) as FullChallengeConfig;
  if (challengeDetails === null) throw `Unable to pull challenge by ID : ${runData.challengeID}`;

  const mapID = challengeDetails.mapID;
  const configMapPath = challengeDetails.mapPath;
  const challengeName = challengeDetails.name;

  let mapPath = "";
  if (mapID) {
    mapPath = (await MapCache.getMapData({ mapID })).url;
    mapPath = `https://antgame.io/assets/${mapPath}`;
  } else mapPath = configMapPath;
  const mapObject = await axios
    .get(mapPath)
    .then(res => res.data as MapFile)
    .catch((err: Error) => {
      throw `threw on fetching map, ${err.message}`;
    });

  const mapData = mapObject.Map;

  runData.homeLocations.forEach(location => {
    mapData[location[0]][location[1]] = "h";
  });

  if (p.foodEaten)
    p.foodEaten.forEach(location => {
      mapData[location[0]][location[1]] = "fe";
    });

  let totalFood;
  if (mapObject.FoodCount) totalFood = mapObject.FoodCount;
  else totalFood = CountOnMap("f", mapData);
  totalFood *= FoodPerCell;

  const homeAmounts: Tooltip[] = [];
  for (const [locationString, value] of Object.entries(runData.homeAmounts)) {
    const posList = locationString.split(",").map(pos => parseInt(pos));

    const score = Math.round((value / totalFood) * 100000);
    homeAmounts.push({
      x: posList[0].toString(),
      y: posList[1].toString(),
      value: score,
    });
  }

  const wrUsername = await ObjectIDToNameCache.getUsername(runData.userID);
  const attributeTag = `${wrUsername} - ${runData.score}`;
  const runNumber = runData.runNumber;

  let foodAmounts: Tooltip[];
  if (mapObject.ToolTips) foodAmounts = mapObject.ToolTips;
  else foodAmounts = GenerateFoodTooltips(mapData);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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

export const GenerateMapThumbnail = async (p: { mapData: string[][]; challengeName: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const diskPathToImage = await DrawMapImage({
    imgWidth: 500,
    mapData: p.mapData,
    challengeName: p.challengeName,
    isThumbnail: true,
  });

  const pathName = SpacesService.uploadMapThumbnail({
    challengeName: p.challengeName,
    image: fs.readFileSync(diskPathToImage),
  });

  fs.unlinkSync(diskPathToImage);

  return pathName;
};
