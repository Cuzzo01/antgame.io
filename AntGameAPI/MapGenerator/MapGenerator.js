const SimplexNoise = require("simplex-noise");
const {
  getRandomInRange,
  AreSurroundingCellsClear,
  RemoveGroupsSmallerThan,
  CountOnMap,
} = require("./Helpers");

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

const WallFoodBuffer = 2;
const BorderSize = 1;
const MinFoodCount = 1000;

const WallNoiseFloorBounds = [0.5, 0.6];
const WallFreqBounds = [3.5, 4.75];
const WallModifierBounds = [1.5, 2.5];
const FoodFreqBounds = [5, 10];
const FoodNoiseFloorBounds = [0.63, 0.73];
const MinFoodGroupSizeBounds = [20, 45];

// currently (200, 112)
const generateMap = (width, height) => {
  const WallFreq = getRandomInRange(WallFreqBounds[0], WallFreqBounds[1]);
  const WallFreqModifier = getRandomInRange(WallModifierBounds[0], WallModifierBounds[1]);
  const FoodFreq = getRandomInRange(FoodFreqBounds[0], FoodFreqBounds[1]);
  const FoodNoiseFloor = getRandomInRange(FoodNoiseFloorBounds[0], FoodNoiseFloorBounds[1]);
  const WallNoiseFloor = getRandomInRange(WallNoiseFloorBounds[0], WallNoiseFloorBounds[1]);
  const MinFoodGroupSize = Math.round(
    getRandomInRange(MinFoodGroupSizeBounds[0], MinFoodGroupSizeBounds[1])
  );

  const WallNoise = new Noise(WallFreq);
  const HighFreqWallNoise = new Noise(WallFreq * WallFreqModifier);
  const FoodNoise = new Noise(FoodFreq);

  let mapData = [];
  for (let x = 0; x < width; x++) {
    mapData[x] = [];
    for (let y = 0; y < height; y++) {
      if (y < BorderSize || height - y <= BorderSize) {
        mapData[x][y] = "w";
        continue;
      } else if (x < BorderSize || width - x <= BorderSize) {
        mapData[x][y] = "w";
        continue;
      }
      const nx = x / width - 0.5;
      const ny = y / height - 0.5;

      const lowVal = WallNoise.getNoise(nx, ny) * 1;
      const midVal = HighFreqWallNoise.getNoise(nx, ny) * 0.5;

      const value = (lowVal + midVal) / (1 + 0.5);

      if (value > WallNoiseFloor) mapData[x][y] = "w";
      else mapData[x][y] = " ";
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (mapData[x][y] === " ") {
        const nx = x / width - 0.5;
        const ny = y / height - 0.5;
        const value = FoodNoise.getNoise(nx, ny);

        if (
          value > FoodNoiseFloor &&
          AreSurroundingCellsClear(x, y, WallFoodBuffer, ["w"], mapData)
        )
          mapData[x][y] = "f";
      }
    }
  }

  RemoveGroupsSmallerThan("f", MinFoodGroupSize, mapData, " ");

  if (CountOnMap("f", mapData) < MinFoodCount) return generateMap(width, height);
  else return mapData;
};

module.exports = { generateMap };
