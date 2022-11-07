const { AntsHandler } = require("./helpers/AntHandler");
const { MapHandler } = require("./helpers/MapHandler");
const { TrailHandler } = require("./helpers/TrailHandler");
const { Config } = require("./Config");

const TrailDecayRate = Config.TrailDecayInterval;

class GameRunner {
  static SimulateRun({ mapData, homeLocations, time, seed, compatibilityDate }) {
    homeLocations.forEach(location => {
      mapData[location[0]][location[1]] = "h";
    });

    const mapHandler = new MapHandler();
    mapHandler.map = mapData;
    mapHandler.prepareForStart();
    mapHandler.compatibilityDate = compatibilityDate;

    const homeTrailHandler = new TrailHandler(mapHandler);
    homeTrailHandler.compatibilityDate = compatibilityDate;
    const foodTrailHandler = new TrailHandler(mapHandler);
    foodTrailHandler.compatibilityDate = compatibilityDate;

    const antHandler = new AntsHandler(mapHandler);
    antHandler.compatibilityDate = compatibilityDate;
    antHandler.spawnAnts({ foodTrailHandler, homeTrailHandler, mapHandler, seed });

    const numOfUpdates = time * 1.5 * 30;
    for (let i = 1; i <= numOfUpdates; i++) {
      antHandler.updateAnts();
      if (i % TrailDecayRate === 0) {
        foodTrailHandler.decayTrailMap();
        homeTrailHandler.decayTrailMap();
      }
    }

    return {
      score: Math.round(mapHandler.percentFoodReturned * 100000),
      foodEaten: mapHandler.foodToRespawn,
    };
  }
}
module.exports = { GameRunner };
