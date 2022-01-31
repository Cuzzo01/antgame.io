const { CountGroupSize, CountOnMap } = require("./Helpers");

const GenerateFoodTooltips = mapData => {
  const foodCount = CountOnMap("f", mapData);
  const tooltips = [];
  const seenList = [];
  for (let x = 0; x < mapData.length; x++) {
    for (let y = 0; y < mapData[x].length; y++) {
      if (mapData[x][y] === "f" && !seenList.includes(`${x}, ${y}`)) {
        foodInGroup = [];
        CountGroupSize(x, y, "f", mapData, foodInGroup);
        const parsedFoodInGroup = [];
        foodInGroup.forEach(point => {
          const xyPos = point.split(",").map(coords => parseInt(coords));
          parsedFoodInGroup.push(xyPos);
        });
        seenList.push(...foodInGroup);
        const foodGroupCount = foodInGroup.length;
        const foodPercent = foodGroupCount / foodCount;
        const tooltipX = parsedFoodInGroup
          .reduce((prev, current, index) => (prev * index + current[0]) / (index + 1), 0)
          .toFixed(2);
        const tooltipY = parsedFoodInGroup
          .reduce((prev, current, index) => (prev * index + current[1]) / (index + 1), 0)
          .toFixed(2);
        tooltips.push({ x: tooltipX, y: tooltipY, value: Math.round(foodPercent * 100000) });
      }
    }
  }
  return tooltips;
};

module.exports = { GenerateFoodTooltips };
