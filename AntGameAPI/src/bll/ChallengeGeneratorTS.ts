import { GenerateFoodTooltips } from "../MapGenerator/FoodTooltipGeneratorTS";
import { CountOnMap } from "../MapGenerator/HelpersTS";
import { MapGenerator } from "../MapGenerator/MapGeneratorTS";
import { MapData } from "../models/Maps/MapData";
import { SpacesServiceProvider } from "../services/SpacesServiceTS";
import { GenerateMapThumbnail } from "./RecordImageGeneratorTS";

const { addNewConfig } = require("../dao/AdminDao");
const { addMapToDB, getMapByName } = require("../dao/MapDao");
// const { getRandomInRange, CountOnMap } = require("../MapGenerator/Helpers");
// const { generateMap } = require("../MapGenerator/MapGenerator");
// const SpacesService = require("../services/SpacesService");
// const Logger = require("../Logger");
// const { GenerateFoodTooltips } = require("../MapGenerator/FoodTooltipGenerator");
// const { getShortMonthName } = require("../helpers/TimeHelper");
// const { GenerateMapThumbnail } = require("./RecordImageGenerator");

const SpacesService = SpacesServiceProvider.getService();

const mapWidth = 200;
const mapHeight = 112;
class ChallengeGenerator {
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

      let mapID;
      let thumbnailPath = false;
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
        )._id;
      }

      const time = Math.round(getRandomInRange(45, 120) / 5) * 5;
      const homeLimit = Math.round(getRandomInRange(2, 8));
      const newChallenge = {
        name: getChallengeName(),
        mapID: mapID,
        seconds: time,
        homeLimit: homeLimit,
        active: false,
        order: -1,
        dailyChallenge: true,
      };
      if (thumbnailPath) newChallenge.thumbnailURL = `https://antgame.io/assets/${thumbnailPath}`;
      const newConfig = await addNewConfig(newChallenge);
      return newConfig._id;
    } catch (err) {
      Logger.log({ message: "Challenge generator error", error: err });
    }
  }
}

const getChallengeName = () => {
  const date = new Date();
  const day = date.getUTCDate();
  const month = getShortMonthName(date);
  return `${month} ${day < 10 ? `0${day}` : day} ${date.getFullYear()}`;
};

module.exports = { ChallengeGenerator };
