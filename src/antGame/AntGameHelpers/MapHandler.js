import { Config } from "../config";

const Brushes = Config.brushes;
const MapBounds = Config.MapBounds;
const FoodPerCell = Config.FoodPerCell;
const PercentFoodReturnedToStopTime = Config.PercentFoodReturnedToStopTime;
const BorderWeight = Config.borderWeight;
const PreloadMapPath = Config.PreloadMapPath;

export class MapHandler {
  constructor(toggleTimerFunc) {
    this._map = [];
    this.mapSetup = false;
    this.redrawMap = true;
    this.pixelDensity = [];
    this.toggleTimer = toggleTimerFunc;
    this.foodReturned = 0;
    this.foodOnMap = 0;
    this.brushColors = {};
    this.cellsToDraw = [];
    this.graphicsSet = false;
  }

  get map() {
    return this._map;
  }

  get homeCellCount() {
    this.countHomeOnMap();
    return this.homeOnMap;
  }

  set graphic(graphics) {
    this._graphics = graphics;
    this._graphics.noStroke();

    this.populateBrushColors();
    this.graphicsSet = true;
  }

  setupMap(canvasWidth, canvasHeight) {
    this.pixelDensity = [
      (canvasWidth / MapBounds[0]).toFixed(2),
      (canvasHeight / MapBounds[1]).toFixed(2),
    ];
    if (Config.debug)
      console.log("Pixel density is: ", [
        this.pixelDensity[0],
        this.pixelDensity[1],
      ]);
  }

  generateMap() {
    this._graphics.clear();
    this._map = [];
    for (let x = 0; x < MapBounds[0]; x++) {
      this._map[x] = [];
      for (let y = 0; y < MapBounds[1]; y++) {
        this._map[x][y] = " ";
      }
    }
    this.mapSetup = true;
  }

  saveMap() {
    var textDoc = document.createElement("a");

    textDoc.href =
      "data:attachment/text," + encodeURI(JSON.stringify(this._map));
    textDoc.target = "_blank";
    const date = new Date();
    const dateString = `${date
      .toDateString()
      .split(" ")
      .join("_")}_${date.getHours()}_${date.getMinutes()}`;
    const mapString = `AntGame_${dateString}.json`;
    textDoc.download = mapString;
    textDoc.click();
  }

  loadMap(map) {
    if (map.length !== MapBounds[0] || map[0].length !== MapBounds[1])
      return false;

    this._map = map;
    this.drawFullMap();
    this.mapSetup = true;
    return true;
  }

  preloadMap() {
    if (!this.mapSetup) {
      this.mapSetup = true;
      fetch(PreloadMapPath)
        .then((response) => response.json())
        .then((map) => this.loadMap(map));
    }
  }

  populateBrushColors() {
    Brushes.forEach((brush) => {
      if (brush.color)
        this.brushColors[brush.value] = this._graphics.color(brush.color);
    });
  }

  drawMap() {
    if (!this.graphicsSet) return;
    let lastCell = "";
    this.cellsToDraw.forEach((cellPos) => {
      let cell = this._map[cellPos[0]][cellPos[1]];
      if (cell.length !== 1) cell = cell[0];
      if (cell !== lastCell) {
        lastCell = cell;
        if (cell === " ") {
          this.setErase();
        } else {
          this.setFillColor(this.brushColors[cell]);
        }
      }
      this.drawCellColor([cellPos[0], cellPos[1]]);
    });
    this.cellsToDraw = [];
    this.redrawMap = false;
  }

  drawFullMap() {
    if (!this.graphicsSet) return;
    this._graphics.clear();
    let lastCell = "";
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        let cell = this._map[x][y];
        if (cell.length !== 1) cell = cell[0];
        if (cell !== " ") {
          if (cell !== lastCell) {
            lastCell = cell;
            this.setFillColor(this.brushColors[cell]);
          }
          this.drawCellColor([x, y]);
        }
      }
    }
  }

  mapXYInBounds(mapXY) {
    if (mapXY[0] >= 0 && mapXY[1] >= 0)
      if (mapXY[0] < MapBounds[0] && mapXY[1] < MapBounds[1]) return true;
    return false;
  }

  paintOnMap(mapPos, brushSize, type) {
    let rangeOffset = Math.floor(brushSize / 2);

    for (let x = mapPos[0] - rangeOffset; x <= mapPos[0] + rangeOffset; x++) {
      for (let y = mapPos[1] - rangeOffset; y <= mapPos[1] + rangeOffset; y++) {
        let cellText = type;
        this.setCellTo([x, y], cellText);
      }
    }
  }

  calculateFoodToStopTime = () => {
    this.placeAndCountFoodOnMap();
    this.foodToStopTime = Math.floor(
      this.foodOnMap * PercentFoodReturnedToStopTime
    );
    console.log(this.foodOnMap, this.foodToStopTime);
  };

  placeAndCountFoodOnMap = () => {
    this.foodOnMap = 0;
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        if (this._map[x][y][0] === "f") {
          this._map[x][y] = "f" + FoodPerCell;
          this.foodOnMap += FoodPerCell;
        }
      }
    }
  };

  countHomeOnMap = () => {
    this.homeOnMap = 0;
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        let cell = this._map[x][y];
        if (cell[0] === "h") this.homeOnMap++;
      }
    }
  };

  resetFoodReturned = () => {
    this.foodReturned = 0;
  };

  returnFood = () => {
    this.foodReturned++;
    this.foodOnMap--;
    if (this.foodReturned >= this.foodToStopTime) this.toggleTimer(false);
  };

  takeFood = (mapXY) => {
    const intMapXY = MapXYToInt(mapXY);
    let cellValue = this._map[intMapXY[0]][intMapXY[1]];
    let cellAmount = parseInt(cellValue.substr(1));
    let newAmount = cellAmount - 1;
    if (newAmount !== 0) this.setCellToSilent(intMapXY, "f" + newAmount);
    else this.setCellTo(intMapXY, " ");
  };

  setCellToSilent(cellPos, type) {
    this._map[cellPos[0]][cellPos[1]] = type;
  }

  setCellTo(cellPos, type) {
    if (this.mapXYInBounds(cellPos)) {
      this._map[cellPos[0]][cellPos[1]] = type;
      this.cellsToDraw.push([cellPos[0], cellPos[1]]);
      this.redrawMap = true;
    }
  }

  getCell = (mapXY) => {
    const intMapXY = MapXYToInt(mapXY);
    if (!this.checkInBounds(intMapXY)) return false;
    let value = this._map[intMapXY[0]][intMapXY[1]];
    if (value[0] === "f") return "f";
    return this._map[intMapXY[0]][intMapXY[1]];
  };

  checkInBounds = (mapXY) => {
    if (mapXY[0] < 0 || mapXY[0] >= MapBounds[0]) return false;
    if (mapXY[1] < 0 || mapXY[1] >= MapBounds[1]) return false;
    return true;
  };

  setFillColor(color) {
    this._graphics.noErase();
    this._graphics.fill(color);
  }

  setErase() {
    this._graphics.erase();
  }

  drawCellColor(mapXY) {
    const intMapXY = MapXYToInt(mapXY);
    this._graphics.rect(
      Math.floor(BorderWeight + intMapXY[0] * this.pixelDensity[0]),
      Math.floor(BorderWeight + intMapXY[1] * this.pixelDensity[1]),
      Math.ceil(this.pixelDensity[0]),
      Math.ceil(this.pixelDensity[1])
    );
  }

  canvasXYToMapXY(canvasXY) {
    return [
      Math.floor((canvasXY[0] - BorderWeight) / this.pixelDensity[0]),
      Math.floor((canvasXY[1] - BorderWeight) / this.pixelDensity[1]),
    ];
  }

  mapXYToCanvasXY(mapXY) {
    return [
      BorderWeight + mapXY[0] * this.pixelDensity[0] + this.pixelDensity[0] / 2,
      BorderWeight + mapXY[1] * this.pixelDensity[1] + this.pixelDensity[1] / 2,
    ];
  }
}

const MapXYToInt = (mapXY) => {
  return [Math.round(mapXY[0]), Math.round(mapXY[1])];
};
