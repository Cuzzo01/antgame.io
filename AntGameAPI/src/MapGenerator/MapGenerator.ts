import SimplexNoise from "simplex-noise";
import {
  AreSurroundingCellsClear,
  CountOnMap,
  getRandomInRange,
  RemoveGroupsSmallerThan,
} from "./Helpers";

const map = (value: number, x1: number, y1: number, x2: number, y2: number) =>
  ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;

class Noise {
  private simplex: SimplexNoise;
  private freq: number;
  constructor(freq: number) {
    this.simplex = new SimplexNoise(Math.random());
    this.freq = freq;
  }

  getNoise = (nx: number, ny: number) => {
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
const DirtChance = 0.857; // 6/7
const DirtNoiseFloorBounds = [0.55, 0.65];
const DirtFreqBounds = [3.5, 4.5];
const MinDirtGroupSize = 20;

export class MapGenerator {
  // currently (200, 112)
  static generateMap(width: number, height: number): string[][] {
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

    const mapData: string[][] = [];
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

    RemoveGroupsSmallerThan("w", 10, mapData, " ");
    RemoveGroupsSmallerThan(" ", 20, mapData, "w");

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

    if (Math.random() < DirtChance) {
      const DirtFreq = getRandomInRange(DirtFreqBounds[0], DirtFreqBounds[1]);
      const DirtNoiseFloor = getRandomInRange(DirtNoiseFloorBounds[0], DirtNoiseFloorBounds[1]);
      const DirtNoise = new Noise(DirtFreq);

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (mapData[x][y] === " ") {
            const nx = x / width - 0.5;
            const ny = y / height - 0.5;

            const value = DirtNoise.getNoise(nx, ny);

            if (value > DirtNoiseFloor) {
              mapData[x][y] = "d";
            }
          }
        }
      }

      RemoveGroupsSmallerThan("d", MinDirtGroupSize, mapData, " ");
      RemoveGroupsSmallerThan(" ", 20, mapData, "d");
    }

    if (CountOnMap("f", mapData) < MinFoodCount) return this.generateMap(width, height);
    else return mapData;
  }
}
