import { Config } from "../../config";

const Brushes = Config.brushes;
const FoodValue = Brushes.find(brush => brush.name === "Food").value;
const DirtValue = Brushes.find(brush => brush.name === "Dirt").value;
const BlockDecaySteps = Config.BlockDecaySteps;
const FoodPerCell = Config.FoodPerCell;
const DirtPerCell = Config.DirtPerCell;
const BorderWeight = Config.borderWeight;
const MapBounds = Config.MapBounds;
const MinDecayableAlpha = Config.MinDecayableAlpha;

export class MapGraphics {
  constructor(graphics) {
    this._graphics = graphics;
    this.pixelDensity = [];
    this.lastCell = "";
    this.brushColors = [];
    this.mapCellPixels = [{}, {}];

    this._graphics.noStroke();
    this.populateBrushColors();
  }

  getMixedFraction(numerator, denominator) {
    var whole = 0;
    while(numerator > denominator) {
        numerator -= denominator;
        whole ++;
    }
    return {whole, numerator, denominator};
  }

  getPixelSizeInfo (mapSize, canvasSize) {
    const mixedFraction = this.getMixedFraction(canvasSize, mapSize);

    const spaceBetweenLongCells = mixedFraction.denominator / mixedFraction.numerator;
    const longCellMapIndexes = [];
    for(let i = 0; i < mixedFraction.numerator; i++){
        longCellMapIndexes.push(Math.floor(spaceBetweenLongCells * i));
    }

    const mapToPixelInfo = {};
    let canvasLocation = 0;
    for(let i = 0; i < mapSize; i++){
      const weight = longCellMapIndexes.includes(i) ? mixedFraction.whole + 1 : mixedFraction.whole;
      mapToPixelInfo[i] = {startingPixel: canvasLocation, weight: weight};
        canvasLocation += weight;
    }
    return mapToPixelInfo;
  }

  setupDrawingInfo(drawableHeight, drawableWidth) {
    this.mapCellPixels[0] = this.getPixelSizeInfo(MapBounds[0], drawableWidth);
    this.mapCellPixels[1] = this.getPixelSizeInfo(MapBounds[1], drawableHeight);
  }

  setupMap(canvasWidth, canvasHeight) {
    const drawableWidth = canvasWidth - BorderWeight * 2;
    const drawableHeight = canvasHeight - BorderWeight * 2;
    this.pixelDensity = [
      (drawableWidth / MapBounds[0]).toFixed(2),
      (drawableHeight / MapBounds[1]).toFixed(2),
    ];
    this.setupDrawingInfo(drawableHeight, drawableWidth);
  }

  populateBrushColors() {
    Brushes.forEach(brush => {
      if (brush.decayable) {
        for (let i = 1; i <= BlockDecaySteps; i++) {
          const index = brush.value + i;
          const alpha =
            Math.round((255 - MinDecayableAlpha) * (i / BlockDecaySteps)) + MinDecayableAlpha;
          this.brushColors[index] = this._graphics.color(brush.color);
          this.brushColors[index].setAlpha(alpha);
        }
      }
      if (brush.color) this.brushColors[brush.value] = this._graphics.color(brush.color);
    });
    this.brushColors["homeText"] = this._graphics.color("#F1948A");
    this.brushColors["foodText"] = this._graphics.color("#7DCEA0");
  }

  drawFullMap({ map }) {
    this._graphics.clear();
    this.lastCell = "";
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        let cell = map[x][y];
        if (cell.length !== 1) cell = cell[0];
        if (cell !== " ") {
          if (cell !== this.lastCell) {
            this.lastCell = cell;
            this.setFillColor(this.brushColors[cell]);
          }
          this.drawCellColor([x, y]);
        }
      }
    }
    this.lastCell = "";
  }

  drawMap({ cellsToDraw, map }) {
    cellsToDraw.forEach(cellPos => {
      let cell = map[cellPos[0]][cellPos[1]];
      if (cell === " ") {
        this.eraseCell(cellPos);
        return;
      }
      if (cell !== this.lastCell) {
        this.lastCell = cell;
        if (cell[0] === FoodValue || cell[0] === DirtValue) {
          const cellAmount = cell.substr(1);
          let strength;
          if (!cellAmount) strength = BlockDecaySteps;
          else {
            const maxPerCell = cell[0] === FoodValue ? FoodPerCell : DirtPerCell;
            strength = Math.ceil(BlockDecaySteps * (cellAmount / maxPerCell));
          }
          const index = cell[0] + strength;
          this.setFillColor(this.brushColors[index]);
        } else {
          this.setFillColor(this.brushColors[cell]);
        }
      }
      this.eraseCell(cellPos);
      this.drawCellColor(cellPos);
    });
  }

  drawHomeAmounts({ homeAmounts, totalFood }) {
    if (homeAmounts)
      for (const [key, value] of Object.entries(homeAmounts)) {
        const location = key.split(",").map(point => parseInt(point));
        const score = Math.round((value / totalFood) * 100000);
        this.drawText([location[0], location[1]], score, this.brushColors.homeText);
      }
  }

  drawFoodAmounts({ foodAmounts }) {
    foodAmounts.forEach(amount => {
      this.drawText([amount.x, amount.y], amount.value, this.brushColors.foodText);
    });
  }

  drawText([x, y], textValue, color) {
    const intMapXY = MapXYToInt([x, y]);
    this._graphics.textAlign(this._graphics.CENTER, this._graphics.CENTER);
    this._graphics.textFont("Courier New", 16);
    this._graphics.fill(color);
    this._graphics.stroke(0);
    this._graphics.strokeWeight(4);
    this._graphics.text(
      textValue,
      BorderWeight + intMapXY[0] * this.pixelDensity[0] + this.pixelDensity[0] / 2,
      BorderWeight + intMapXY[1] * this.pixelDensity[1] + this.pixelDensity[1] / 2,
    );
    this.lastCell = false;
    this._graphics.strokeWeight(0);
  }

  setFillColor(color) {
    this._graphics.noErase();
    this._graphics.fill(color);
  }

  eraseCell(intMapXY) {
    this._graphics.erase();
    this.drawCellColor(intMapXY);
    this._graphics.noErase();
  }

  drawCellColor(mapXY) {
    const intMapXY = MapXYToInt(mapXY);
    this._graphics.rect(
      this.mapCellPixels[0][intMapXY[0]].startingPixel + BorderWeight,
      this.mapCellPixels[1][intMapXY[1]].startingPixel + BorderWeight,
      this.mapCellPixels[0][intMapXY[0]].weight,
      this.mapCellPixels[1][intMapXY[1]].weight
      );
  }

  mapXYToCanvasXY(mapXY) {
    return [
      BorderWeight + mapXY[0] * this.pixelDensity[0] + this.pixelDensity[0] / 2,
      BorderWeight + mapXY[1] * this.pixelDensity[1] + this.pixelDensity[1] / 2,
    ];
  }

  canvasXYToMapXY(canvasXY) {
    let mapX;
    let mapY;

    for(const key in this.mapCellPixels[0]){
      const keyDrawingInfo = this.mapCellPixels[0][key];
      if(this.canvasLocationInsideRange(canvasXY[0], keyDrawingInfo)){
        mapX = key;
      }
    }
    for(const key in this.mapCellPixels[1]){
      const keyDrawingInfo = this.mapCellPixels[1][key];
      if(this.canvasLocationInsideRange(canvasXY[1], keyDrawingInfo)){
        mapY = key;
      }
    }

    return [
      Math.floor(mapX), Math.floor(mapY)
    ];
  }

  canvasLocationInsideRange(canvasLocation, drawingInfo) {
    return drawingInfo.startingPixel <= canvasLocation - BorderWeight && canvasLocation - BorderWeight <= drawingInfo.startingPixel + drawingInfo.weight
  }
}

const MapXYToInt = mapXY => {
  return [Math.round(mapXY[0]), Math.round(mapXY[1])];
};
