const { GenerateFoodTooltips } = require("../MapGenerator/FoodTooltipGenerator");
const { generateMap } = require("../MapGenerator/MapGenerator");

const width = 200;
const height = 112;

async function getRandomMap(req, res) {
  try {
    const mapData = generateMap(width, height);

    const toReturn = {
      MapVersion: 2,
      MapName: "GeneratedMap" + parseInt(Math.random() * 10000),
      Map: mapData,
      Tooltips: GenerateFoodTooltips(mapData),
    };

    res.send(toReturn);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Map generation failed");
  }
}
module.exports = { getRandomMap };
