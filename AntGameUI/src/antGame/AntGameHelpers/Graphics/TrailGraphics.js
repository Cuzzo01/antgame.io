import { Config } from "../../config";

const TrailMapOverSampleRate = 3;
const BorderWeight = Config.borderWeight;
const MapBounds = [Config.MapBounds[0] * TrailMapOverSampleRate, Config.MapBounds[1] * TrailMapOverSampleRate];

export class TrailGraphics {
  constructor(color) {
    this.color = color;
  }

  set graphics(graphics) {
    this._graphics = graphics;

    this.canvasBounds = [this._graphics.width, this._graphics.height];
    this.color = this._graphics.color(this.color);
    this._graphics.fill(this.color);
    this._graphics.noStroke();
    this.decayMode = this._graphics.REMOVE;
    this.drawMode = this._graphics.BLEND;
    this.setPixelDensity();
  }

  drawPoints(trailHandler) {
    const pointsToUpdate = trailHandler.pointsToUpdate;
    for (const key of Object.keys(pointsToUpdate)) {
      const trailXY = key.split(",").map(string => parseInt(string));
      const strength = trailHandler.trailMap[trailXY[0]][trailXY[1]] / 1600;
      const canvasXY = this.trailXYToCanvasXY(trailXY);
      this.eraseCell(canvasXY);
      this.color.setAlpha(Math.round(strength * 200) + 25);
      this._graphics.fill(this.color);
      this._graphics.rect(canvasXY[0], canvasXY[1], this.size[0], this.size[1]);
      delete pointsToUpdate[key];
    }
  }

  clear() {
    this._graphics.clear();
  }

  eraseCell(canvasXY) {
    this._graphics.erase();
    this._graphics.rect(canvasXY[0], canvasXY[1], this.size[0], this.size[1]);
    this._graphics.noErase();
  }

  decayTrail() {
    this._graphics.blendMode(this.decayMode);
    this._graphics.fill(0, Config.AlphaPerDecay);
    this._graphics.rect(0, 0, this.canvasBounds[0], this.canvasBounds[1]);
    this._graphics.blendMode(this.drawMode);
    this._graphics.fill(this.color);
  }

  refreshSize() {
    this.canvasBounds = [this._graphics.width, this._graphics.height];
    this.setPixelDensity();
    this._graphics.clear();
  }

  setPixelDensity() {
    const drawableWidth = this.canvasBounds[0] - BorderWeight;
    const drawableHeight = this.canvasBounds[1] - BorderWeight;
    this.pixelDensity = [drawableWidth / MapBounds[0], drawableHeight / MapBounds[1]];
    this.size = [Math.ceil(this.pixelDensity[0]), Math.ceil(this.pixelDensity[1])];
  }

  trailXYToCanvasXY(mapXY) {
    return [
      Math.round(BorderWeight + mapXY[0] * this.pixelDensity[0] + this.pixelDensity[0] / 2),
      Math.round(BorderWeight + mapXY[1] * this.pixelDensity[1] + this.pixelDensity[1] / 2),
    ];
  }
}
