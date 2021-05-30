import { Config } from "../config";

const Brushes = Config.brushes;
const MapBounds = Config.MapBounds;
const FoodPerCell = Config.FoodPerCell;
const PercentFoodReturnedToStopTime = Config.PercentFoodReturnedToStopTime;
const BorderWeight = Config.borderWeight;
const PreloadMapPath = Config.PreloadMapPath;
const BlockDecaySteps = Config.BlockDecaySteps;
const FoodPerDecayStep = FoodPerCell / BlockDecaySteps;
const DirtPerCell = Config.DirtPerCell;
const DirtDecayPerStep = DirtPerCell / BlockDecaySteps;
const MinDecayableAlpha = Config.MinDecayableAlpha;
const FoodBrushValue = Brushes.find((brush) => brush.name === "Food").value;
const SampleMapPaths = Config.SampleMaps;

export class MapHandler {
  constructor(toggleTimerFunc) {
    this._map = [];
    this.mapSetup = false;
    this.redrawMap = true;
    this.redrawFullMap = false;
    this.pixelDensity = [];
    this.toggleTimer = toggleTimerFunc;
    this.foodReturned = 0;
    this.foodOnMap = 0;
    this.brushColors = {};
    this.cellsToDraw = [];
    this.graphicsSet = false;
    this.foodToRespawn = [];
    this.dirtToRespawn = [];
    this.lastCell = "";
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
    this.foodToRespawn = [];
    this.dirtToRespawn = [];
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
    this.foodToRespawn = [];
    this.dirtToRespawn = [];
    this.redrawFullMap = true;
    this.mapSetup = true;
    return true;
  }

  preloadMap() {
    if (!this.mapSetup) {
      this.mapSetup = true;
      this.fetchAndLoadMap(PreloadMapPath);
    }
  }

  loadSampleMap() {
    const path =
      SampleMapPaths[Math.floor(Math.random() * SampleMapPaths.length)];
    this.fetchAndLoadMap(path);
  }

  fetchAndLoadMap(path) {
    fetch(path)
      .then((response) => response.json())
      .then((map) => this.loadMap(map));
  }

  populateBrushColors() {
    Brushes.forEach((brush) => {
      if (brush.decayable) {
        for (let i = 1; i <= BlockDecaySteps; i++) {
          const index = brush.value + i;
          const alpha =
            Math.round((255 - MinDecayableAlpha) * (i / BlockDecaySteps)) +
            MinDecayableAlpha;
          this.brushColors[index] = this._graphics.color(brush.color);
          this.brushColors[index].setAlpha(alpha);
        }
      }
      if (brush.color)
        this.brushColors[brush.value] = this._graphics.color(brush.color);
    });
  }

  drawMap() {
    if (!this.graphicsSet) return;
    this.cellsToDraw.forEach((cellPos) => {
      let cell = this._map[cellPos[0]][cellPos[1]];
      if (cell === " ") {
        this.eraseCell(cellPos);
        return;
      }
      if (cell !== this.lastCell) {
        this.lastCell = cell;
        if (cell[0] === FoodBrushValue || cell[0] === "d") {
          const cellAmount = cell.substr(1);
          let strength;
          if (!cellAmount) strength = BlockDecaySteps;
          else {
            const maxPerCell =
              cell[0] === FoodBrushValue ? FoodPerCell : DirtPerCell;
            strength = Math.ceil(BlockDecaySteps * (cellAmount / maxPerCell));
            this.eraseCell(cellPos);
          }
          const index = cell[0] + strength;
          this.setFillColor(this.brushColors[index]);
        } else {
          this.setFillColor(this.brushColors[cell]);
        }
      }
      this.drawCellColor(cellPos);
    });
    this.cellsToDraw = [];
    this.redrawMap = false;
  }

  eraseCell(intMapXY) {
    this._graphics.erase();
    this.drawCellColor(intMapXY);
    this._graphics.noErase();
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
    this.redrawFullMap = false;
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

  prepareForStart = () => {
    this.placeAndCountDecayableBlocks();
    this.calculateFoodToStopTime();
    this.resetFoodReturned();
  };

  calculateFoodToStopTime = () => {
    this.foodToStopTime = Math.floor(
      this.foodOnMap * PercentFoodReturnedToStopTime
    );
    console.log(this.foodOnMap, this.foodToStopTime);
  };

  placeAndCountDecayableBlocks = () => {
    this.foodOnMap = 0;
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        if (this._map[x][y][0] === "f") {
          this._map[x][y] = "f" + FoodPerCell;
          this.foodOnMap += FoodPerCell;
        } else if (this._map[x][y][0] === "d") {
          this._map[x][y] = "d" + DirtPerCell;
        }
      }
    }
  };

  resetFoodReturned = () => {
    this.foodReturned = 0;
  };

  findNewDirt = () => {
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        if (this._map[x][y] === "d") {
          this._map[x][y] = "d" + DirtPerCell;
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

  returnFood = () => {
    this.foodReturned++;
    this.foodOnMap--;
    if (this.foodReturned >= this.foodToStopTime) this.toggleTimer(false);
  };

  decayDirt = (mapXY) => {
    const intMapXY = MapXYToInt(mapXY);
    let cellValue = this._map[intMapXY[0]][intMapXY[1]];
    let cellAmount = parseInt(cellValue.substr(1));
    let newAmount = cellAmount - 1;
    if (newAmount === 0) {
      this.dirtToRespawn.push(intMapXY);
      this.setCellTo(intMapXY, " ");
    } else if (newAmount % DirtDecayPerStep === 0) {
      this.setCellTo(intMapXY, "d" + newAmount);
    } else {
      this.setCellToSilent(intMapXY, "d" + newAmount);
    }
  };

  takeFood = (mapXY) => {
    const intMapXY = MapXYToInt(mapXY);
    let cellValue = this._map[intMapXY[0]][intMapXY[1]];
    let cellAmount = parseInt(cellValue.substr(1));
    let newAmount = cellAmount - 1;
    if (newAmount === 0) {
      this.foodToRespawn.push(intMapXY);
      this.setCellTo(intMapXY, " ");
    } else if (newAmount % FoodPerDecayStep === 0) {
      this.setCellTo(intMapXY, "f" + newAmount);
    } else {
      this.setCellToSilent(intMapXY, "f" + newAmount);
    }
  };

  respawnDecayableBlocks = () => {
    this.foodToRespawn.forEach((cell) => {
      this._map[cell[0]][cell[1]] = "f";
    });
    this.foodToRespawn = [];
    this.dirtToRespawn.forEach((cell) => {
      this._map[cell[0]][cell[1]] = "d";
    });
    this.dirtToRespawn = [];
    this.redrawFullMap = true;
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
    return this._map[intMapXY[0]][intMapXY[1]][0];
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
