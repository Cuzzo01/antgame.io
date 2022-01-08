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
      const dateObject = new Date();
      const month = (dateObject.getMonth() + 1).toString();
      const monthDisplay = month.length == 1 ? "0" + month : month;
      const date = dateObject.getDate().toString();
      const dateDisplay = date.length === 1 ? "0" + date : date;
      const mapName = `Daily_${dateObject.getFullYear()}-${monthDisplay}-${dateDisplay}`;

      const mapData = generateMap(mapWidth, mapHeight);
      const mapObject = {
        MapVersion: 1,
        MapName: mapName,
        Map: mapData,
      };

      const mapURL = SpacesService.uploadDailyMap(mapName, mapObject);

      const time = Math.round(getRandomInRange(60, 180) / 5) * 5;
      const homeLimit = Math.round(getRandomInRange(2, 10));
      const newChallenge = {
        name: getChallengeName(),
        mapPath: mapURL,
        seconds: time,
        homeLimit: homeLimit,
        active: false,
      };
      await addNewConfig(newChallenge);
    } catch (err) {
      Logger.log({ message: "Challenge generator error", error: err });
    }
  }
}

const getChallengeName = () => {
  const month = getShortMonthName();
  const day = new Date().getDate();
  return `Daily ${month} ${day}`;
};

const getShortMonthName = () => {
  let month;
  switch (new Date().getMonth()) {
    case 0:
      month = "Jan";
    case 1:
      month = "Feb";
    case 2:
      month = "Mar";
    case 3:
      month = "Apr";
    case 4:
      month = "May";
    case 5:
      month = "Jun";
    case 6:
      month = "Jul";
    case 7:
      month = "Aug";
    case 8:
      month = "Sep";
    case 9:
      month = "Oct";
    case 10:
      month = "Nov";
    case 11:
      month = "Dec";
  }
  return month;
};

module.exports = { ChallengeGenerator };
