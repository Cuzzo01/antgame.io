export const getRandomInRange = (lowerBound: number, upperBound: number) => {
  return Math.random() * (lowerBound - upperBound) + upperBound;
};

export const RemoveGroupsSmallerThan = (
  charToRemove: string,
  minGroupSize: number,
  mapArr: string[][],
  replaceWith: string
) => {
  const seenList: string[] = [];
  for (let x = 0; x < mapArr.length; x++) {
    for (let y = 0; y < mapArr[0].length; y++) {
      const cellValue = mapArr[x][y];
      if (cellValue === charToRemove && !seenList.includes(`${x}, ${y}`)) {
        const newlySeen: string[] = [];
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

export const CountGroupSize = (
  x: number,
  y: number,
  charToCount: string,
  mapArr: string[][],
  seenList: string[],
  abortAt = 0
) => {
  seenList.push(`${x}, ${y}`);
  if (abortAt && seenList.length >= abortAt) return;
  const pointsToCheck: number[][] = [];
  pointsToCheck.push([x - 1, y]);
  pointsToCheck.push([x + 1, y]);
  pointsToCheck.push([x, y - 1]);
  pointsToCheck.push([x, y + 1]);
  for (const point of pointsToCheck) {
    const x = point[0];
    const y = point[1];
    if (mapArr[x] && mapArr[x][y]) {
      const cellValue = mapArr[x][y];
      if (cellValue === charToCount && !seenList.includes(`${x}, ${y}`))
        CountGroupSize(x, y, charToCount, mapArr, seenList, abortAt);
    }
  }
};

export const AreSurroundingCellsClear = (
  x: number,
  y: number,
  radius: number,
  clearOf: string[],
  mapArr: string[][]
) => {
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

export const CountOnMap = (charToCount: string, mapData: string[][]) => {
  let count = 0;
  for (let x = 0; x < mapData.length; x++) {
    for (let y = 0; y < mapData[x].length; y++) {
      if (mapData[x][y] === charToCount) count++;
    }
  }
  return count;
};
