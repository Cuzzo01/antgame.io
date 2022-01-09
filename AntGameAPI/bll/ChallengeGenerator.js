const { addNewConfig } = require("../dao/AdminDao");
const { getRandomInRange } = require("../MapGenerator/Helpers");
const { generateMap } = require("../MapGenerator/MapGenerator");
const SpacesService = require("../services/SpacesService");
const Logger = require("../Logger");

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
        MapVersion: 1,
        MapName: mapName,
        Map: mapData,
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
  return `${month} ${day} ${date.getFullYear()}`;
};

const getShortMonthName = date => {
  let month;
  switch (date.getMonth()) {
    case 0:
      month = "Jan";
      break;
    case 1:
      month = "Feb";
      break;
    case 2:
      month = "Mar";
      break;
    case 3:
      month = "Apr";
      break;
    case 4:
      month = "May";
      break;
    case 5:
      month = "Jun";
      break;
    case 6:
      month = "Jul";
      break;
    case 7:
      month = "Aug";
      break;
    case 8:
      month = "Sep";
      break;
    case 9:
      month = "Oct";
      break;
    case 10:
      month = "Nov";
      break;
    case 11:
      month = "Dec";
      break;
  }
  return month;
};

module.exports = { ChallengeGenerator };
