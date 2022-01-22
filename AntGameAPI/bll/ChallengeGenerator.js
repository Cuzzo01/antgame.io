const { addNewConfig } = require("../dao/AdminDao");
const { getRandomInRange } = require("../MapGenerator/Helpers");
const { generateMap } = require("../MapGenerator/MapGenerator");
const SpacesService = require("../services/SpacesService");
const Logger = require("../Logger");
const { GenerateFoodTooltips } = require("../MapGenerator/FoodTooltipGenerator");
const { getShortMonthName } = require("../helpers/TimeHelper");

const mapWidth = 200;
const mapHeight = 112;
class ChallengeGenerator {
  constructor() {
    SpacesService.initializeConnection();
  }

  async generateDailyChallenge() {
    try {
      const mapName = getChallengeName().replace(/ /g, "_");

      const mapData = generateMap(mapWidth, mapHeight);
      const mapObject = {
        MapVersion: 2,
        MapName: mapName,
        Map: mapData,
        Tooltips: GenerateFoodTooltips(mapData),
      };

      const mapURL = SpacesService.uploadDailyMap(mapName, mapObject);

      const time = Math.round(getRandomInRange(60, 180) / 5) * 5;
      const homeLimit = Math.round(getRandomInRange(2, 8));
      const newChallenge = {
        name: getChallengeName(),
        mapPath: mapURL,
        seconds: time,
        homeLimit: homeLimit,
        active: false,
        order: -1,
        dailyChallenge: true,
      };
      const newConfig = await addNewConfig(newChallenge);
      return newConfig._id;
    } catch (err) {
      Logger.log({ message: "Challenge generator error", error: err });
    }
  }
}

const getChallengeName = () => {
  const date = new Date();
  const day = date.getDate();
  const month = getShortMonthName(date);
  return `${month} ${day < 10 ? `0${day}` : day} ${date.getFullYear()}`;
};

module.exports = { ChallengeGenerator };
