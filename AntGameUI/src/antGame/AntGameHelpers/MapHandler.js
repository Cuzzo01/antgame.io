import axios from "axios";
import { Config } from "../config";
import { SaveGameHandler } from "./MapHelpers/SaveGameHandler";

const Brushes = Config.brushes;
const MapBounds = Config.MapBounds;
const PercentFoodReturnedToStopTime = Config.PercentFoodReturnedToStopTime;
const BorderWeight = Config.borderWeight;
const BlockDecaySteps = Config.BlockDecaySteps;
const FoodPerCell = Config.FoodPerCell;
const DirtPerCell = Config.DirtPerCell;
const FoodPerDecayStep = FoodPerCell / BlockDecaySteps;
const DirtDecayPerStep = DirtPerCell / BlockDecaySteps;
const MinDecayableAlpha = Config.MinDecayableAlpha;
const FoodValue = Brushes.find(brush => brush.name === "Food").value;
const HomeValue = Brushes.find(brush => brush.name === "Home").value;
const DirtValue = Brushes.find(brush => brush.name === "Dirt").value;
const SampleMaps = Config.SampleMaps;

export class MapHandler {
  constructor(toggleTimerFunc) {
    this.toggleTimer = toggleTimerFunc;

    this._map = [];
    this.mapSetup = false;
    this.redrawMap = true;
    this.redrawFullMap = false;
    this.pixelDensity = [];
    this.foodReturned = 0;
    this.foodOnMap = 0;
    this.foodRatio = 0;
    this.foodToStopTime = 0;
    this.foodInTransit = 0;
    this.brushColors = {};
    this.cellsToDraw = [];
    this.graphicsSet = false;
    this.foodToRespawn = [];
    this.dirtToRespawn = [];
    this.lastCell = "";
    this.mapName = "";
    this.lastLoadedSamplePath = "";
    this._gameMode = "";
    this.foodReturnedLocations = {};
    this.foodAmounts = false;
    this._shouldDrawFoodAmounts = true;
    this._shouldDrawHomeAmounts = false;
    this.homeAmountsDrawn = false;
  }

  set gameMode(mode) {
    this._gameMode = mode;
  }

  set name(name) {
    this.setTitle(name);
    this.mapName = name;
  }

  set shouldDrawFoodAmounts(value) {
    this._shouldDrawFoodAmounts = value;
  }

  get map() {
    return this._map;
  }

  get percentFoodReturned() {
    this.calculateFoodRatio();
    return this.foodRatio;
  }

  get homeFoodCounts() {
    return this.foodReturnedLocations;
  }

  get homeCellCount() {
    this.countHomeOnMap();
    return this.homeOnMap;
  }

  set homeCellsAllowed(homeCellsAllowed) {
    this._homeCellsAllowed = homeCellsAllowed;
  }

  get foodPerCell() {
    return FoodPerCell;
  }

  get dirtPerCell() {
    return DirtPerCell;
  }

  set graphic(graphics) {
    this._graphics = graphics;
    this._graphics.noStroke();

    this.populateBrushColors();
    this.graphicsSet = true;
  }

  setupMap(canvasWidth, canvasHeight) {
    const drawableWidth = canvasWidth - BorderWeight * 2;
    const drawableHeight = canvasHeight - BorderWeight * 2;
    this.pixelDensity = [
      (drawableWidth / MapBounds[0]).toFixed(2),
      (drawableHeight / MapBounds[1]).toFixed(2),
    ];
    if (Config.debug)
      console.log("Pixel density is: ", [this.pixelDensity[0], this.pixelDensity[1]]);
  }

  clearMap() {
    if (this._gameMode === "challenge") {
      this.clearHomeTiles();
      return false;
    }
    this.generateMap();
    return true;
  }

  clearHomeTiles() {
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        if (this._map[x][y] === HomeValue) {
          this.cellsToDraw.push([x, y]);
          this._map[x][y] = " ";
        }
      }
    }
    this.lastCell = "";
    this.homeOnMap = 0;
    this.redrawMap = true;
  }

  generateMap() {
    this._graphics.clear();
    this._map = [];
    this.foodAmounts = false;
    this.foodToRespawn = [];
    this.dirtToRespawn = [];
    this.foodToStopTime = 0;
    this.mapName = "";
    if (this._gameMode !== "challenge") document.title = "AntGame";
    for (let x = 0; x < MapBounds[0]; x++) {
      this._map[x] = [];
      for (let y = 0; y < MapBounds[1]; y++) {
        this._map[x][y] = " ";
      }
    }
    this.mapSetup = true;
  }

  saveMap() {
    const MapName = this.mapName ? this.mapName : "UnnamedMap";
    const dataToSave = SaveGameHandler.GenerateSaveGame(this._map, MapName);
    const fileName = SaveGameHandler.GenerateSaveGameName(MapName);
    SaveGameHandler.Download(dataToSave, fileName);
  }

  loadMap(data, setTitle = true) {
    const loadResult = SaveGameHandler.LoadSaveGame(data);

    if (loadResult === false) return false;
    if (loadResult.name) {
      this.mapName = loadResult.name;
    } else {
      this.mapName = "Old Map";
    }
    if (setTitle && loadResult.name) this.setTitle(this.mapName);

    this._map = loadResult.map;
    if (loadResult.tooltips) this.foodAmounts = loadResult.tooltips;
    this.countHomeOnMap();
    this.foodToRespawn = [];
    this.dirtToRespawn = [];
    this.redrawFullMap = true;
    this.mapSetup = true;
    return true;
  }

  setTitle(mapName) {
    if (mapName) document.title = `${mapName} - AntGame`;
  }

  fetchAndLoadMap(path) {
    let setTitle = true;
    if (this._gameMode === "challenge") setTitle = false;
    return axios.get(path).then(res => {
      this.loadMap(res.data, setTitle);
    });
  }

  preloadMap(mapToLoad) {
    if (!this.mapSetup) {
      this.fetchAndLoadMap(mapToLoad);
      this.lastLoadedSamplePath = mapToLoad;
    }
  }

  loadSampleMap() {
    let path = this.getNewSamplePath();
    while (this.lastLoadedSamplePath === path) {
      path = this.getNewSamplePath();
    }
    this.lastLoadedSamplePath = path;
    return this.fetchAndLoadMap(path);
  }

  getNewSamplePath() {
    const keys = Object.keys(SampleMaps);
    const index = Math.floor(Math.random() * keys.length);
    return SampleMaps[keys[index]];
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

  drawMap() {
    if (!this.graphicsSet) return;
    this.cellsToDraw.forEach(cellPos => {
      let cell = this._map[cellPos[0]][cellPos[1]];
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
    if (this.cellsToDraw.length || this._shouldDrawHomeAmounts) this.drawHomeAmounts();
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
    this.drawFoodAmounts();
    this.drawHomeAmounts();
    this.lastCell = "";
    this.redrawFullMap = false;
    this.redrawMap = false;
  }

  drawFoodAmounts() {
    if (!this.graphicsSet) return;
    if (this.foodAmounts && this._shouldDrawFoodAmounts)
      this.foodAmounts.forEach(amount => {
        this.drawText([amount.x, amount.y], amount.value, this.brushColors.foodText);
      });
  }

  drawHomeAmounts() {
    if (!this.graphicsSet) return;
    if (this.homeAmounts && this._shouldDrawHomeAmounts) {
      const totalFood = this.foodOnMap + this.foodInTransit + this.foodReturned;
      for (const [key, value] of Object.entries(this.homeAmounts)) {
        const location = key.split(",").map(point => parseInt(point));
        const score = Math.round((value / totalFood) * 100000);
        this.drawText([location[0], location[1]], score, this.brushColors.homeText);
      }
      this.homeAmountsDrawn = true;
      this._shouldDrawHomeAmounts = false;
    } else {
      this.homeAmountsDrawn = false;
    }
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
      Math.floor(BorderWeight + intMapXY[0] * this.pixelDensity[0] + this.pixelDensity[0] / 2),
      Math.floor(BorderWeight + intMapXY[1] * this.pixelDensity[1] + this.pixelDensity[1] / 2)
    );
    this.lastCell = false;
    this._graphics.strokeWeight(0);
  }

  mapXYInBounds(mapXY) {
    if (mapXY[0] >= 0 && mapXY[1] >= 0)
      if (mapXY[0] < MapBounds[0] && mapXY[1] < MapBounds[1]) return true;
    return false;
  }

  paintOnMap(mapPos, brushSize, type) {
    if (!this.mapSetup) return;

    let rangeOffset = Math.floor(brushSize / 2);
    let foodRemoved = 0;

    for (let x = mapPos[0] - rangeOffset; x <= mapPos[0] + rangeOffset; x++) {
      for (let y = mapPos[1] - rangeOffset; y <= mapPos[1] + rangeOffset; y++) {
        if (!this.mapXYInBounds([x, y])) continue;
        const cellText = type;
        const currentValue = this.map[x][y];
        if (currentValue === cellText) continue;

        if (this._gameMode === "challenge") {
          if (currentValue !== " " && currentValue !== HomeValue) continue;
          if (cellText === HomeValue && this.homeOnMap >= this._homeCellsAllowed) continue;
        }
        if (this.foodToStopTime !== 0) {
          if (currentValue[0] === FoodValue) {
            const foodOnSquare = parseInt(this.map[x][y].substr(1));
            if (foodOnSquare) foodRemoved += foodOnSquare;
          }
        }
        if (cellText === HomeValue) this.homeOnMap++;
        if (currentValue === HomeValue) this.homeOnMap--;
        this.setCellTo([x, y], cellText);
        if (this.homeAmountsDrawn) {
          this.homeAmountsDrawn = false;
          this.redrawFullMap = true;
        }
      }
    }
    if (foodRemoved) this.foodOnMap -= foodRemoved;
    if (this._gameMode === "sandbox" && this._shouldDrawFoodAmounts) {
      this.foodAmounts = false;
      this.shouldDrawFoodAmounts = false;
      this.redrawFullMap = true;
    }
  }

  prepareForStart = IsChallenge => {
    if (IsChallenge) {
      this.countHomeOnMap(IsChallenge);
    }
    this.placeAndCountDecayableBlocks();
    this.calculateFoodToStopTime();
    this.foodReturned = 0;
    this.foodReturnedLocations = {};
    this.redrawFullMap = true;
  };

  calculateFoodToStopTime = () => {
    this.foodToStopTime = Math.floor(
      (this.foodOnMap + this.foodReturned + this.foodInTransit) * PercentFoodReturnedToStopTime
    );
  };

  placeAndCountDecayableBlocks = () => {
    this.foodOnMap = 0;
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        if (this._map[x][y][0] === FoodValue) {
          this._map[x][y] = FoodValue + FoodPerCell;
          this.foodOnMap += FoodPerCell;
        } else if (this._map[x][y][0] === DirtValue) {
          this._map[x][y] = DirtValue + DirtPerCell;
        }
      }
    }
  };

  handleReset = () => {
    this.foodReturned = 0;
    this.foodReturnedLocations = {};
    this.foodInTransit = 0;
    this.respawnDecayableBlocks();
    this.placeAndCountDecayableBlocks();
  };

  setPRInfo = ({ locations, amounts }) => {
    locations.forEach(location => {
      this.setCellTo([location[0], location[1]], "h");
    });
    this.homeOnMap = locations.length;
    this.setHomeAmounts(amounts);
  };

  setHomeAmounts = amounts => {
    this.homeAmounts = amounts;
    this._shouldDrawHomeAmounts = true;
    this.redrawMap = true;
  };

  findNewDecayableBlocks = () => {
    let foodAdded = 0;
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        const cell = this._map[x][y];
        if (cell === DirtValue) {
          this._map[x][y] = DirtValue + DirtPerCell;
        } else if (cell === FoodValue) {
          this._map[x][y] = FoodValue + FoodPerCell;
          foodAdded += FoodPerCell;
        }
      }
    }
    this.foodOnMap += foodAdded;
  };

  countHomeOnMap = recordLocations => {
    this.homeOnMap = 0;
    if (!this._map.length) return;
    if (recordLocations) this.homeLocations = [];
    for (let x = 0; x < MapBounds[0]; x++) {
      for (let y = 0; y < MapBounds[1]; y++) {
        let cell = this._map[x][y];
        if (cell[0] === HomeValue) {
          if (recordLocations) this.homeLocations.push([x, y]);
          this.homeOnMap++;
        }
      }
    }
  };

  calculateFoodRatio = () => {
    if (this.foodToStopTime === 0) return 0;
    const totalFood = this.foodOnMap + this.foodInTransit + this.foodReturned;
    this.foodRatio = this.foodReturned / totalFood;
  };

  returnFood = homePosition => {
    this.foodReturned++;
    this.foodInTransit--;
    const homePositionInt = MapXYToInt(homePosition);
    if (this.foodReturnedLocations[homePositionInt])
      this.foodReturnedLocations[homePositionInt] += 1;
    else this.foodReturnedLocations[homePositionInt] = 1;
    if (this.foodReturned === this.foodToStopTime && this._gameMode === "sandbox")
      this.toggleTimer(false);
  };

  decayDirt = mapXY => {
    const intMapXY = MapXYToInt(mapXY);
    let cellValue = this._map[intMapXY[0]][intMapXY[1]];
    let cellAmount = parseInt(cellValue.substr(1));
    let newAmount = cellAmount - 1;
    if (newAmount === 0) {
      this.dirtToRespawn.push(intMapXY);
      this.setCellTo(intMapXY, " ");
    } else if (newAmount % DirtDecayPerStep === 0) {
      this.setCellTo(intMapXY, DirtValue + newAmount);
    } else {
      this.setCellToSilent(intMapXY, DirtValue + newAmount);
    }
  };

  takeFood = mapXY => {
    const intMapXY = MapXYToInt(mapXY);
    let cellValue = this._map[intMapXY[0]][intMapXY[1]];
    let cellAmount = parseInt(cellValue.substr(1));
    let newAmount = cellAmount - 1;
    this.foodInTransit++;
    this.foodOnMap--;
    if (newAmount === 0) {
      this.foodToRespawn.push(intMapXY);
      this.setCellTo(intMapXY, " ");
    } else if (newAmount % FoodPerDecayStep === 0) {
      this.setCellTo(intMapXY, FoodValue + newAmount);
    } else {
      this.setCellToSilent(intMapXY, FoodValue + newAmount);
    }
  };

  respawnDecayableBlocks = () => {
    this.foodToRespawn.forEach(cell => {
      this._map[cell[0]][cell[1]] = FoodValue;
    });
    this.foodToRespawn = [];
    this.dirtToRespawn.forEach(cell => {
      this._map[cell[0]][cell[1]] = DirtValue;
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

  getCell = mapXY => {
    const intMapXY = MapXYToInt(mapXY);
    if (!this.checkInBounds(intMapXY)) return false;
    return this._map[intMapXY[0]][intMapXY[1]][0];
  };

  checkInBounds = mapXY => {
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

const MapXYToInt = mapXY => {
  return [Math.round(mapXY[0]), Math.round(mapXY[1])];
};
