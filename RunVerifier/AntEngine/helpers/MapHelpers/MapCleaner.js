const CleanFoodAndDirt = mapData => {
  for (let x = 0; x < mapData.length; x++) {
    for (let y = 0; y < mapData[x].length; y++) {
      const cell = mapData[x][y];

      if (cell.includes("f")) mapData[x][y] = "f";
      else if (cell.includes("d")) mapData[x][y] = "d";
    }
  }
};
module.exports = { CleanFoodAndDirt };
