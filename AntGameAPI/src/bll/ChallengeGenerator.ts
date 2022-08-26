import { LoggerProvider } from "../LoggerTS";
import { GenerateFoodTooltips } from "../MapGenerator/FoodTooltipGenerator";
import { CountOnMap, getRandomInRange } from "../MapGenerator/Helpers";
import { MapGenerator } from "../MapGenerator/MapGenerator";
import { SpacesServiceProvider } from "../services/SpacesService";
import { GenerateMapThumbnail } from "./RecordImageGenerator";
import { addNewConfig } from "../dao/AdminDao";

import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { MapData } from "../models/Maps/MapData";
import { addMapToDB, getMapByName } from "../dao/MapDao";
import { TimeHelper } from "../helpers/TimeHelperTS";
import { ObjectId } from "mongodb";
import { MapHandler } from "../handler/MapHandler";

const Logger = LoggerProvider.getInstance();
const SpacesService = SpacesServiceProvider.getService();

const mapWidth = 200;
const mapHeight = 112;
export class ChallengeGenerator {
  async generateDailyChallenge(): Promise<ObjectId | false> {
    try {
      const mapName = getChallengeName().replace(/ /g, "_");

      let mapID: ObjectId;
      let thumbnailPath: boolean | string = false;
      const sameNameMap = (await getMapByName({ name: mapName })) as MapData;
      if (sameNameMap) {
        mapID = sameNameMap._id;
        const mapData = await MapHandler.getCache().getMapData({ mapID: mapID.toString() });
        thumbnailPath = mapData.thumbnailPath;
      } else {
        const mapData = MapGenerator.generateMap(mapWidth, mapHeight);
        const foodCount = CountOnMap("f", mapData);
        const mapObject = {
          MapVersion: 2,
          MapName: mapName,
          Map: mapData,
          Tooltips: GenerateFoodTooltips(mapData),
          FoodCount: foodCount,
        };

        const mapPath = await SpacesService.uploadDailyMap(mapName, mapObject);
        thumbnailPath = await GenerateMapThumbnail({
          mapData,
          challengeName: getChallengeName(),
        });
        mapID = (await addMapToDB({
          url: mapPath,
          name: mapName,
          foodCount: foodCount,
          thumbnailPath,
        })) as ObjectId;
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const newConfig = (await addNewConfig(newChallenge)) as ObjectId;
      return newConfig;
    } catch (err) {
      Logger.logError("Challenge Generator", err as Error);
      return false;
    }
  }
}

const getChallengeName = () => {
  const date = new Date();
  const day = date.getUTCDate();
  const month = TimeHelper.getShortMonthName(date);
  return `${month} ${day < 10 ? `0${day}` : day} ${date.getFullYear()}`;
};
