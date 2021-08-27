const SimplexNoise = require("simplex-noise");

const map = (value, x1, y1, x2, y2) => ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;

class Noise {
  constructor(freq) {
    this.simplex = new SimplexNoise(Math.random());
    this.freq = freq;
  }

  getNoise = (nx, ny) => {
    return map(this.simplex.noise2D(this.freq * nx, this.freq * ny), -1, 1, 0, 1);
  };
}

const BorderSize = 2;
const WallNoiseFloor = 0.5;
const FoodNoiseFloor = 0.7;
const WallBaseFreq = 4.5;
const FoodFreq = 5;
const WallFoodBuffer = 2;

// currently (200, 112)
const generateMap = (width, height) => {
  const noise1 = new Noise(WallBaseFreq);
  const noise2 = new Noise(WallBaseFreq * 2);
  const noise3 = new Noise(FoodFreq);

  let toReturn = [];
  for (let x = 0; x < width; x++) {
    toReturn[x] = [];
    for (let y = 0; y < height; y++) {
      if (y < BorderSize || height - y < BorderSize) {
        toReturn[x][y] = "w";
        continue;
      } else if (x < BorderSize || width - x < BorderSize) {
        toReturn[x][y] = "w";
        continue;
      }
      const nx = x / width - 0.5;
      const ny = y / height - 0.5;

      const lowVal = noise1.getNoise(nx, ny);
      const midVal = noise2.getNoise(nx, ny) * 0.5;

      const value = (lowVal + midVal) / (1 + 0.5);

      if (value > WallNoiseFloor) toReturn[x][y] = "w";
      else toReturn[x][y] = " ";
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (toReturn[x][y] === " ") {
        const nx = x / width - 0.5;
        const ny = y / height - 0.5;

        const value = noise3.getNoise(nx, ny);

        if (
          value > FoodNoiseFloor &&
          AreSurroundingCellsClear(x, y, WallFoodBuffer, ["w"], toReturn)
        )
          toReturn[x][y] = "f";
      }
    }
  }

  return toReturn;
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

module.exports = { generateMap };
