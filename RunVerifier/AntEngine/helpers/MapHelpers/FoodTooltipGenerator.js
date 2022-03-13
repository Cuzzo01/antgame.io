const GenerateFoodTooltips = mapData => {
  const foodCount = CountOnMap("f", mapData);
  const tooltips = [];
  const seenList = [];
  for (let x = 0; x < mapData.length; x++) {
    for (let y = 0; y < mapData[x].length; y++) {
      if (mapData[x][y] === "f" && !seenList.includes(`${x}, ${y}`)) {
        const foodInGroup = [];
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

const CountOnMap = (charToCount, mapData) => {
  let count = 0;
  for (let x = 0; x < mapData.length; x++) {
    for (let y = 0; y < mapData[x].length; y++) {
      if (mapData[x][y] === charToCount) count++;
    }
  }
  return count;
};

const CountGroupSize = (x, y, charToCount, mapArr, seenList, abortAt = 0) => {
  seenList.push(`${x}, ${y}`);
  if (abortAt && seenList.length >= abortAt) return;
  let pointsToCheck = [];
  pointsToCheck.push([x - 1, y]);
  pointsToCheck.push([x + 1, y]);
  pointsToCheck.push([x, y - 1]);
  pointsToCheck.push([x, y + 1]);
  pointsToCheck.forEach(point => {
    const x = point[0];
    const y = point[1];
    if (mapArr[x] && mapArr[x][y]) {
      const cellValue = mapArr[x][y];
      if (cellValue === charToCount && !seenList.includes(`${x}, ${y}`))
        CountGroupSize(x, y, charToCount, mapArr, seenList);
    }
  });
};

module.exports = { GenerateFoodTooltips, CountOnMap };
