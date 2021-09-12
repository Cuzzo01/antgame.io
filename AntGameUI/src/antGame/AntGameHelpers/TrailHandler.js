import { Config } from "../config";

const TrailMapOverSampleRate = 3;
const MapBounds = [
  Config.MapBounds[0] * TrailMapOverSampleRate,
  Config.MapBounds[1] * TrailMapOverSampleRate,
];
const BorderWeight = Config.borderWeight;

export class TrailHandler {
  constructor(color, mapHandler) {
    this.graphicsSet = false;
    this.mapHandler = mapHandler;
    this.canvasBounds = [];
    this.color = color;
    this.trailMap = [];
  }

  set graphic(graphics) {
    this._graphics = graphics;
    this.clean = true;

    this.canvasBounds = [this._graphics.width, this._graphics.height];

    this.decayMode = this._graphics.REMOVE;
    this.drawMode = this._graphics.BLEND;

    this._graphics.noStroke();
    this.color = this._graphics.color(this.color);
    this._graphics.fill(this.color);

    this.width = this._graphics.width;
    this.graphicsSet = true;

    this.buildTrailMap();
  }

  buildTrailMap() {
    for (let x = 0; x < MapBounds[0]; x++) {
      this.trailMap[x] = [];
      for (let y = 0; y < MapBounds[1]; y++) {
        this.trailMap[x][y] = 0;
      }
    }
    const drawableWidth = this.canvasBounds[0] - BorderWeight;
    const drawableHeight = this.canvasBounds[1] - BorderWeight;
    this.pixelDensity = [drawableWidth / MapBounds[0], drawableHeight / MapBounds[1]];
  }

  prepareForAntUpdate() {
    this._graphics.loadPixels();
  }

  dropPoint(mapXY, transparency) {
    const trailXY = this.mapXYToTrailXY(mapXY);
    const canvasXY = this.trailXYToCanvasXY(trailXY);
    this._graphics.circle(canvasXY[0], canvasXY[1], Config.TrailDiameter);
    if (this.clean) this.clean = false;
    const strength = Math.round(110 * (1 - transparency) + 25);

    const intTrailXY = MapXYToInt(trailXY);
    const maxValue = 1500 * (1 - transparency) + 100;
    for (let xOffset = -TrailMapOverSampleRate; xOffset <= TrailMapOverSampleRate; xOffset++) {
      for (let yOffset = -TrailMapOverSampleRate; yOffset <= TrailMapOverSampleRate; yOffset++) {
        const point = [intTrailXY[0] + xOffset, intTrailXY[1] + yOffset];
        const cellStrength = Math.round(
          strength * (1 - (Math.abs(xOffset) + Math.abs(yOffset)) / (4 * TrailMapOverSampleRate))
        );
        if (cellStrength && this.mapXYInBounds(point)) {
          const currentValue = this.trailMap[point[0]][point[1]];
          if (currentValue < maxValue) {
            const newValue = currentValue + cellStrength;
            this.trailMap[point[0]][point[1]] = newValue > maxValue ? maxValue : newValue;
          }
        }
      }
    }
  }

  decayTrail() {
    this._graphics.blendMode(this.decayMode);
    this._graphics.fill(0, Config.AlphaPerDecay);
    this._graphics.rect(0, 0, this.canvasBounds[0], this.canvasBounds[1]);
    this._graphics.blendMode(this.drawMode);
    this._graphics.fill(this.color);
    this.decayTrailMap();
  }

  decayTrailMap() {
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        if (this.trailMap[x][y] > 0) {
          this.trailMap[x][y] = Math.round(0.8 * this.trailMap[x][y]);
          if (this.trailMap[x][y] < 75) this.trailMap[x][y] = 0;
        }
      }
    }
  }

  checkLine(mapStart, mapStop) {
    if (mapStart[0] < 0 || mapStart[1] < 0) return 0;
    if (mapStop[0] < 0 || mapStop[1] < 0) return 0;

    const mapPoints = getPoints(mapStart, mapStop);
    for (let i = 0; i < mapPoints.length; i++) {
      const point = mapPoints[i];
      const cell = this.mapHandler.getCell(point);
      if (cell !== " ") {
        return cell;
      }
    }

    if (this.clean) return 0;

    const trailXYStart = this.mapXYToTrailXY(mapStart);
    const trailXYStop = this.mapXYToTrailXY(mapStop);
    const pointsToWalk = getPoints(trailXYStart, trailXYStop);
    let toReturn = 0;
    for (let i = 0; i < pointsToWalk.length; i++) {
      let point = pointsToWalk[i];
      if (this.mapXYInBounds(point)) toReturn += this.trailMap[point[0]][point[1]];
    }
    return toReturn;
  }

  clearTrails = () => {
    this._graphics.clear();
    this.buildTrailMap();
    this.clean = true;
  };

  trailXYToCanvasXY(mapXY) {
    return [
      BorderWeight + mapXY[0] * this.pixelDensity[0] + this.pixelDensity[0] / 2,
      BorderWeight + mapXY[1] * this.pixelDensity[1] + this.pixelDensity[1] / 2,
    ];
  }

  mapXYToTrailXY(mapXY) {
    return [mapXY[0] * TrailMapOverSampleRate, mapXY[1] * TrailMapOverSampleRate];
  }

  mapXYInBounds(mapXY) {
    if (mapXY[0] >= 0 && mapXY[1] >= 0)
      if (mapXY[0] < MapBounds[0] && mapXY[1] < MapBounds[1]) return true;
    return false;
  }
}

const MapXYToInt = mapXY => {
  return [Math.round(mapXY[0]), Math.round(mapXY[1])];
};

// Bresenham alg
const getPoints = (start, stop) => {
  var x1 = start[0];
  var y1 = start[1];
  const x2 = stop[0];
  const y2 = stop[1];
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  var err = dx - dy;
  const toReturn = [];
  toReturn.push([x1, y1]);
  while (!(x1 === x2 && y1 === y2)) {
    const e2 = err << 1;
    if (e2 > -dy) {
      err -= dy;
      x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y1 += sy;
    }
    toReturn.push([x1, y1]);
  }
  return toReturn;
};
