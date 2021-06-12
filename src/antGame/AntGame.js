import React from "react";
import Sketch from "react-p5";
import { disableBodyScroll } from "body-scroll-lock";

import { Config } from "./config";

import { StaticElements } from "./AntGameHelpers/StaticElements";
import { MapHandler } from "./AntGameHelpers/MapHandler";
import { AntsHandler as AntHandler } from "./AntGameHelpers/AntHandler";
import { TrailHandler } from "./AntGameHelpers/TrailHandler";
import { TimerHandler } from "./AntGameHelpers/Menu/TimeCounter";
import MenuBar from "./AntGameHelpers/Menu/MenuBar";
import { AntFoodSmol, AntSmol } from "./AntGameHelpers/AntImages";
import { GTMEmitter } from "./AntGameHelpers/GTMEmitter";

let canvasW, canvasH;
let lastMousePos = [-1, -1];

const Debug = Config.debug;
const TrailDecayRate = Config.TrailDecayInterval;
const BrushSizeDefault = Config.brushSizes[Config.brushSizeDefaultIndex].value;
const DefaultBrush = Config.brushes[Config.brushTypeDefaultIndex];
const Brushes = Config.brushes;
const BorderWeight = Config.borderWeight;
const TrailDropRate = Config.TrailDropRate;
const FrameRate = Config.FrameRate;
const PreloadMap = Config.PreloadMap;

export default class AntGame extends React.Component {
  constructor(props) {
    super(props);

    let bodyElement = document.querySelector("body");
    disableBodyScroll(bodyElement);

    this.brushSize = BrushSizeDefault;
    this.brushType = DefaultBrush.value;
    this.windowSize = [];
    this.frameCount = 0;
    this.blockDrawing = false;
    this.imageToSave = "";

    this.timerHandler = new TimerHandler();

    this.mapHandler = new MapHandler(this.toggleTimer);
    this.antHandler = new AntHandler(this.mapHandler);

    let emptyMap = true;
    if (PreloadMap) {
      this.mapHandler.preloadMap(props.mapToLoad);
      emptyMap = false;
    }

    this.state = {
      loading: true,
      emptyMap: emptyMap,
      shouldResizeCanvas: false,
      playState: false,
      time: {
        min: "00",
        sec: "00",
      },
      timerActive: false,
      foodReturned: 0,
    };

    this.homeTrailHandler = new TrailHandler(
      Brushes.find((brush) => brush.value === "h").color,
      this.mapHandler
    );
    this.foodTrailHandler = new TrailHandler(
      Brushes.find((brush) => brush.value === "f").color,
      this.mapHandler
    );
  }

  setup = (p5, parentRef) => {
    this.parentRef = parentRef;

    this.antImage = p5.loadImage(AntSmol);
    this.antFoodImage = p5.loadImage(AntFoodSmol);

    this.setupAndInitialize(p5);

    p5.createCanvas(canvasW, canvasH).parent(parentRef);

    if (!this.mapHandler.mapSetup) this.mapHandler.generateMap();
    if (Debug) {
      console.log(`mapSize: ${this.mapHandler.mapSize}`);
      StaticElements.grid(
        this.staticElements,
        this.mapHandler.mapSize,
        this.mapHandler.pixelDensity,
        155,
        canvasW,
        canvasH
      );
    }

    p5.frameRate(FrameRate);
  };

  setupAndInitialize = (p5) => {
    this.windowSize = [p5.windowWidth, p5.windowHeight];
    canvasW = p5.windowWidth - this.parentRef.offsetLeft * 2;
    canvasH = p5.windowHeight - this.parentRef.offsetTop * 1.5;

    if (Debug) console.log(`canvasSize: ${[canvasW, canvasH]}`);

    this.mapHandler.setupMap(canvasW, canvasH);
    this.mapHandler.redrawMap = true;

    this.backgroundGraphic = p5.createGraphics(canvasW, canvasH);
    this.staticElements = p5.createGraphics(canvasW, canvasH);
    this.antGraphic = p5.createGraphics(canvasW, canvasH);
    this.mapGraphic = p5.createGraphics(canvasW, canvasH);
    this.homeTrailGraphic = p5.createGraphics(canvasW, canvasH);
    this.foodTrailGraphic = p5.createGraphics(canvasW, canvasH);

    this.homeTrailHandler.graphic = this.homeTrailGraphic;
    this.foodTrailHandler.graphic = this.foodTrailGraphic;
    this.mapHandler.graphic = this.mapGraphic;

    StaticElements.border(this.staticElements, BorderWeight, 0);
    StaticElements.background(this.backgroundGraphic);
  };

  draw = (p5) => {
    if (this.state.playState && p5.frameCount % FrameRate === 0) {
      this.frameCount = p5.frameCount;
    }

    if (this.imageToSave !== "") this.handleImageSave(p5);

    if (
      this.state.shouldResizeCanvas &&
      this.homeTrailHandler.clean &&
      this.foodTrailHandler.clean
    ) {
      this.resizeCanvas(p5);
      this.mapHandler.drawFullMap();
      this.homeTrailGraphic.clear();
      this.foodTrailGraphic.clear();
    }

    if (p5.mouseIsPressed) this.handleMousePressed(p5);

    if (
      (this.state.playState && !Debug) ||
      (Debug && p5.keyIsPressed && p5.key === "s")
    ) {
      if (p5.frameCount % TrailDropRate === 0) {
        this.antHandler.updateAnts(true);
      } else this.antHandler.updateAnts(false);
      if (p5.frameCount % TrailDecayRate === 0) {
        this.foodTrailHandler.decayTrail();
        this.homeTrailHandler.decayTrail();
      }
    }

    if (this.mapHandler.redrawMap) this.mapHandler.drawMap();
    else if (this.mapHandler.redrawFullMap) this.mapHandler.drawFullMap();

    if (this.antHandler.redrawAnts)
      this.antHandler.drawAnts(
        this.antGraphic,
        this.antImage,
        this.antFoodImage
      );

    p5.image(this.backgroundGraphic, 0, 0);
    p5.image(this.foodTrailGraphic, 0, 0);
    p5.image(this.homeTrailGraphic, 0, 0);
    p5.image(this.mapGraphic, 0, 0);
    p5.image(this.antGraphic, 0, 0);
    p5.image(this.staticElements, 0, 0);

    if (this.state.loading) this.setState({ loading: false });
  };

  handleImageSave = (p5) => {
    if (this.imageToSave === "trail") {
      p5.clear();
      p5.image(this.foodTrailGraphic, 0, 0);
      p5.image(this.homeTrailGraphic, 0, 0);
      p5.saveCanvas("trails");
    } else if (this.imageToSave === "map") {
      p5.clear();
      p5.image(this.mapGraphic, 0, 0);
      p5.saveCanvas("map");
    } else if (this.imageToSave === "map&trail") {
      p5.clear();
      p5.image(this.foodTrailGraphic, 0, 0);
      p5.image(this.homeTrailGraphic, 0, 0);
      p5.image(this.mapGraphic, 0, 0);
      p5.saveCanvas("map&trails");
    }
    this.imageToSave = "";
  };

  resizeCanvas = (p5) => {
    this.setupAndInitialize(p5);
    p5.resizeCanvas(canvasW, canvasH);
    this.setState({ shouldResizeCanvas: false });
    if (Debug) {
      StaticElements.grid(
        this.staticElements,
        this.mapHandler.mapSize,
        this.mapHandler.pixelDensity,
        155,
        canvasW,
        canvasH
      );
    }
  };

  handleMousePressed = (p5) => {
    if (this.state.playState || p5.mouseButton === "right") return;

    let mousePos = this.mapHandler.canvasXYToMapXY([p5.mouseX, p5.mouseY]);

    if (this.blockDrawing) return;
    if (mousePos[0] !== lastMousePos[0] || mousePos[1] !== lastMousePos[1]) {
      lastMousePos = mousePos;
      if (this.mapHandler.mapXYInBounds(mousePos)) {
        this.mapHandler.paintOnMap(mousePos, this.brushSize, this.brushType);
        if (this.state.emptyMap) this.setState({ emptyMap: false });
      }
    }
  };

  updateBrushSize = (size) => {
    this.brushSize = size;
  };

  updateBrushType = (type) => {
    this.brushType = type;
  };

  updatePlayState = (state) => {
    if (state) {
      this.foodTrackerInterval = setInterval(() => {
        this.setState({ foodReturned: this.mapHandler.percentFoodReturned });
      }, 500);
      if (this.state.emptyMap) return;
      this.toggleTimer(true);
      if (!this.antHandler.antsSpawned) {
        this.antHandler.spawnAnts(this.homeTrailHandler, this.foodTrailHandler);
        this.mapHandler.prepareForStart();
      } else {
        this.mapHandler.findNewDecayableBlocks();
        this.mapHandler.calculateFoodToStopTime();
      }
    } else {
      clearInterval(this.foodTrackerInterval);
      this.toggleTimer(false);
    }
    this.setState({ playState: state });
    GTMEmitter.PlayHandler(state);
  };

  toggleTimer = (state) => {
    if (state) {
      this.timerInterval = setInterval(() => {
        this.timerHandler.handleTime(this.frameCount, this.setTime);
      }, 1000);
      this.setState({ timerActive: true });
    } else {
      clearInterval(this.timerInterval);
      this.setState({
        timerActive: false,
        foodReturned: this.mapHandler.percentFoodReturned,
      });
    }
  };

  setTime = (time) => {
    this.setState({ time: time });
  };

  setMapName = (mapName) => {
    this.mapHandler.name = mapName;
  };

  clearMap = () => {
    this.mapHandler.generateMap();
    this.setState({ emptyMap: true });
    this.reset();
    GTMEmitter.ClearHandler();
  };

  saveMapHandler = () => {
    this.mapHandler.saveMap();
    GTMEmitter.SaveHandler();
  };

  loadMapHandler = (map) => {
    if (this.mapHandler.loadMap(map)) this.setState({ emptyMap: false });
    GTMEmitter.LoadHandler();
  };

  resizeHandler = (event) => {
    if (
      event.windowWidth === this.windowSize[0] &&
      event.windowHeight === this.windowSize[1]
    ) {
      this.setState({ shouldResizeCanvas: false });
    } else this.setState({ shouldResizeCanvas: true });
  };

  reset = () => {
    this.antHandler.clearAnts();
    this.foodTrailHandler.clearTrails();
    this.homeTrailHandler.clearTrails();
    this.timerHandler.resetTime();
    this.mapHandler.handleReset();
    this.setState({
      time: {
        min: "00",
        sec: "00",
      },
      foodReturned: 0,
    });
  };

  resetHandler = () => {
    this.reset();
    GTMEmitter.ResetHandler();
  };

  saveImageHandler = (imageToSave) => {
    this.imageToSave = imageToSave;
    GTMEmitter.SaveImageHandler(imageToSave);
  };

  setBlockDraw = (blockDrawing) => {
    this.blockDrawing = blockDrawing;
  };

  loadSampleMap = () => {
    this.mapHandler.loadSampleMap().then((_) => this.reset());
    if (this.state.emptyMap) this.setState({ emptyMap: false });
    GTMEmitter.LoadSampleHandler();
  };

  render() {
    return (
      <div style={styles.container}>
        <div style={styles.centered}>
          <div style={styles.header}>
            <MenuBar
              time={this.state.time}
              timerActive={this.state.timerActive}
              playState={this.state.playState}
              playButtonHandler={this.updatePlayState}
              resetHandler={this.resetHandler}
              clearMapHandler={this.clearMap}
              loadMapHandler={this.loadMapHandler}
              saveMapHandler={this.saveMapHandler}
              mapClear={this.state.emptyMap}
              brushSizeHandler={this.updateBrushSize}
              brushTypeHandler={this.updateBrushType}
              blockDrawHandler={this.setBlockDraw}
              saveImageHandler={this.saveImageHandler}
              loadSampleMapHandler={this.loadSampleMap}
              setMapNameHandler={this.setMapName}
              getMapName={() => this.mapHandler.mapName}
              foodReturned={this.state.foodReturned}
            />
          </div>
          <Sketch
            setup={this.setup}
            draw={this.draw}
            windowResized={this.resizeHandler}
          />
        </div>
      </div>
    );
  }
}

const styles = {
  header: {
    paddingBottom: "5px",
  },
  resizeButton: {
    justifySelf: "left",
  },
  TimeCounter: {
    justifySelf: "right",
    paddingRight: "1em",
  },
  container: {
    padding: "25px",
    backgroundColor: "#EBF5FB",
    height: "100vh",
  },
  centered: {
    textAlign: "center",
  },
};
