import { Config } from "../../config";

const TrailMapOverSampleRate = 3;
const BorderWeight = Config.borderWeight;
const MapBounds = [
  Config.MapBounds[0] * TrailMapOverSampleRate,
  Config.MapBounds[1] * TrailMapOverSampleRate,
];
const TrailDiameter = Config.TrailDiameter;

export class TrailGraphics {
  constructor(color) {
    this.clean = true;
    this.pointsToDraw = [];
    this.color = color;
  }

  get hasPointsToDraw() {
    return this.pointsToDraw.length > 0;
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

  addPointToDraw(trailXY) {
    this.pointsToDraw.push(trailXY);
  }

  drawPoints() {
    this.pointsToDraw.forEach(trailXY => {
      const canvasXY = this.trailXYToCanvasXY(trailXY);
      this._graphics.circle(canvasXY[0], canvasXY[1], TrailDiameter);
    });
    this.pointsToDraw = [];
  }

  clear() {
    this._graphics.clear();
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
  }

  trailXYToCanvasXY(mapXY) {
    return [
      BorderWeight + mapXY[0] * this.pixelDensity[0] + this.pixelDensity[0] / 2,
      BorderWeight + mapXY[1] * this.pixelDensity[1] + this.pixelDensity[1] / 2,
    ];
  }
}
