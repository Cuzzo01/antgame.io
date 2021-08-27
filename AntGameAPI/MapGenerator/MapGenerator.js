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
const WallBaseFreq = 4;

// currently (200, 112)
const generateMap = (width, height) => {
  const noise1 = new Noise(WallBaseFreq);
  const noise2 = new Noise(WallBaseFreq * 2);

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

  return toReturn;
};

module.exports = { generateMap };
