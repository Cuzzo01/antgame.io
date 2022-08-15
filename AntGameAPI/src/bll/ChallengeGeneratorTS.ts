import { getShortMonthName } from "../helpers/TimeHelper";
import { LoggerProvider } from "../LoggerTS";
import { GenerateFoodTooltips } from "../MapGenerator/FoodTooltipGeneratorTS";
import { CountOnMap, getRandomInRange } from "../MapGenerator/HelpersTS";
import { MapGenerator } from "../MapGenerator/MapGeneratorTS";
import { SpacesServiceProvider } from "../services/SpacesServiceTS";
import { GenerateMapThumbnail } from "./RecordImageGeneratorTS";
import { addNewConfig } from "../dao/AdminDao";

import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { MapData } from "../models/Maps/MapData";
import { addMapToDB, getMapByName } from "../dao/MapDao";

const Logger = LoggerProvider.getInstance();
const SpacesService = SpacesServiceProvider.getService();

const mapWidth = 200;
const mapHeight = 112;
export class ChallengeGenerator {
  async generateDailyChallenge() {
    try {
      const mapName = getChallengeName().replace(/ /g, "_");

      const mapData = MapGenerator.generateMap(mapWidth, mapHeight);
      const foodCount = CountOnMap("f", mapData);
      const mapObject = {
        MapVersion: 2,
        MapName: mapName,
        Map: mapData,
        Tooltips: GenerateFoodTooltips(mapData),
        FoodCount: foodCount,
      };

      let mapID: string;
      let thumbnailPath: boolean | string = false;
      const sameNameMap = (await getMapByName({ name: mapName })) as MapData;
      if (sameNameMap) mapID = sameNameMap._id;
      else {
        const mapPath = SpacesService.uploadDailyMap(mapName, mapObject);
        thumbnailPath = await GenerateMapThumbnail({
          mapData,
          challengeName: getChallengeName(),
        });
        mapID = (
          await addMapToDB({ url: mapPath, name: mapName, foodCount: foodCount, thumbnailPath })
        )._id as string;
      }

      const time = Math.round(getRandomInRange(45, 120) / 5) * 5;
      const homeLimit = Math.round(getRandomInRange(2, 8));
      const newChallenge: FullChallengeConfig = {
        name: getChallengeName(),
        mapID: mapID,
        seconds: time,
        homeLimit: homeLimit,
        active: false,
        order: -1,
        dailyChallenge: true,
      };
      if (thumbnailPath) newChallenge.thumbnailURL = `https://antgame.io/assets/${thumbnailPath}`;
      const newConfig = (await addNewConfig(newChallenge))._id as string;
      return newConfig;
    } catch (err) {
      Logger.logError("Challenge Generator", err as Error);
    }
  }
}

const getChallengeName = () => {
  const date = new Date();
  const day = date.getUTCDate();
  const month = getShortMonthName(date);
  return `${month} ${day < 10 ? `0${day}` : day} ${date.getFullYear()}`;
};
