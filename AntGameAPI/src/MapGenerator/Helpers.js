const getRandomInRange = (lowerBound, upperBound) => {
  return Math.random() * (lowerBound - upperBound) + upperBound;
};

const RemoveGroupsSmallerThan = (charToRemove, minGroupSize, mapArr, replaceWith) => {
  let seenList = [];
  for (let x = 0; x < mapArr.length; x++) {
    for (let y = 0; y < mapArr[0].length; y++) {
      const cellValue = mapArr[x][y];
      if (cellValue === charToRemove && !seenList.includes(`${x}, ${y}`)) {
        let newlySeen = [];
        if (seenList.includes(`${x}, ${y}`)) continue;
        CountGroupSize(x, y, charToRemove, mapArr, newlySeen, minGroupSize * 5);
        if (newlySeen.length < minGroupSize) {
          newlySeen.forEach(location => {
            const xyPos = location.split(",").map(coord => parseInt(coord));
            mapArr[xyPos[0]][xyPos[1]] = replaceWith;
          });
        } else {
          newlySeen.forEach(point => {
            if (!seenList.includes(point)) seenList.push(point);
          });
        }
      }
    }
  }
};

const CountGroupSize = (x, y, charToCount, mapArr, seenList, abortAt = 0) => {
  seenList.push(`${x}, ${y}`);
  if (abortAt && seenList.length >= abortAt) return;
  let pointsToCheck = [];
  pointsToCheck.push([x - 1, y]);
  pointsToCheck.push([x + 1, y]);
  pointsToCheck.push([x, y - 1]);
  pointsToCheck.push([x, y + 1]);
  for (const index in pointsToCheck) {
    const point = pointsToCheck[index];
    const x = point[0];
    const y = point[1];
    if (mapArr[x] && mapArr[x][y]) {
      const cellValue = mapArr[x][y];
      if (cellValue === charToCount && !seenList.includes(`${x}, ${y}`))
        CountGroupSize(x, y, charToCount, mapArr, seenList, abortAt);
    }
  }
};

const AreSurroundingCellsClear = (x, y, radius, clearOf, mapArr) => {
  for (let i = x - radius; i <= x + radius; i++) {
    for (let j = y - radius; j <= y + radius; j++) {
      if (i < 0 || i > mapArr.length - 1) continue;
      if (j < 0 || j > mapArr[0].length - 1) continue;

      const cellValue = mapArr[i][j];
      for (let k = 0; k < clearOf.length; k++) {
        const charToCheck = clearOf[k];
        if (charToCheck === cellValue) return false;
      }
    }
  }
  return true;
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

module.exports = {
  getRandomInRange,
  RemoveGroupsSmallerThan,
  CountGroupSize,
  AreSurroundingCellsClear,
  CountOnMap,
};
