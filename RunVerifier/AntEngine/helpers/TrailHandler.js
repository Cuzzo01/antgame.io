const { Config } = require("../Config");

const TrailMapOverSampleRate = 3;
const TrailBounds = [
  Config.MapBounds[0] * TrailMapOverSampleRate,
  Config.MapBounds[1] * TrailMapOverSampleRate,
];

class TrailHandler {
  constructor(mapHandler, trailGraphics) {
    this.mapHandler = mapHandler;
    if (trailGraphics) this.trailGraphics = trailGraphics;
    else this.trailGraphics = false;
    this.buildTrailMap();
  }

  buildTrailMap() {
    this.trailMap = [];
    for (let x = 0; x < TrailBounds[0]; x++) {
      this.trailMap[x] = [];
      for (let y = 0; y < TrailBounds[1]; y++) {
        this.trailMap[x][y] = 0;
      }
    }
    this.clean = true;
  }

  dropPoint(mapXY, transparency) {
    const trailXY = this.mapXYToTrailXY(mapXY);
    if (this.trailGraphics) this.trailGraphics.addPointToDraw(trailXY);
    if (this.clean) this.clean = false;
    const strength = Math.round(110 * (1 - transparency) + 25);

    const intTrailXY = MapXYToInt(trailXY);
    const maxValue = 1500 * (1 - transparency) + 100;
    // const maxValue = 3000 * (1 - transparency) + 100;
    for (let xOffset = -TrailMapOverSampleRate; xOffset <= TrailMapOverSampleRate; xOffset++) {
      for (let yOffset = -TrailMapOverSampleRate; yOffset <= TrailMapOverSampleRate; yOffset++) {
        const point = [intTrailXY[0] + xOffset, intTrailXY[1] + yOffset];
        if (strength && this.trailXYInBounds(point)) {
          const currentValue = this.trailMap[point[0]][point[1]];
          if (currentValue < maxValue) {
            const newValue = currentValue + strength;
            this.trailMap[point[0]][point[1]] = newValue > maxValue ? maxValue : newValue;
          }
        }
      }
    }
  }

  decayTrailMap() {
    for (let x = 0; x < TrailBounds[0]; x++) {
      for (let y = 0; y < TrailBounds[1]; y++) {
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

    const trailXYEnd = this.mapXYToTrailXY(mapStop);
    if (this.trailXYInBounds(trailXYEnd)) return this.trailMap[trailXYEnd[0]][trailXYEnd[1]];
    else {
      const trailXYStart = this.mapXYToTrailXY(mapStart);
      const pointsToWalk = getPoints(trailXYStart, trailXYEnd);
      let toReturn = 0;
      for (let i = 0; i < pointsToWalk.length; i++) {
        let point = pointsToWalk[i];
        if (this.trailXYInBounds(point)) toReturn += this.trailMap[point[0]][point[1]];
      }
      return toReturn / pointsToWalk.length;
    }
  }

  clearTrails = () => {
    this.buildTrailMap();
  };

  mapXYToTrailXY(mapXY) {
    return [mapXY[0] * TrailMapOverSampleRate, mapXY[1] * TrailMapOverSampleRate];
  }

  trailXYInBounds(trailXY) {
    if (trailXY[0] >= 0 && trailXY[1] >= 0)
      if (trailXY[0] < TrailBounds[0] && trailXY[1] < TrailBounds[1]) return true;
    return false;
  }
}
module.exports = { TrailHandler };

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
