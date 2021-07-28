import React from "react";
import Sketch from "react-p5";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";

import { Config } from "./config";

import { StaticElements } from "./AntGameHelpers/StaticElements";
import { MapHandler } from "./AntGameHelpers/MapHandler";
import { AntsHandler as AntHandler } from "./AntGameHelpers/AntHandler";
import { TrailHandler } from "./AntGameHelpers/TrailHandler";
import { TimerHandler } from "./AntGameHelpers/Menu/Timer/TimerHandler";
import MenuBar from "./AntGameHelpers/Menu/MenuBar";
import { AntFoodSmol, AntSmol } from "./AntGameHelpers/AntImages";
import { GTMEmitter } from "./AntGameHelpers/GTMEmitter";
import { GameModeContext } from "./GameModeContext";
import ChallengeHandler from "./Challenge/ChallengeHandler";
import ChallengeModal from "./AntGameHelpers/Challenge/ChallengeModal";

let canvasW, canvasH;
let lastMousePos = [-1, -1];

const Debug = Config.debug;
const TrailDecayRate = Config.TrailDecayInterval;
const Brushes = Config.brushes;
const BrushSizeDefault = Config.brushSizes[Config.brushSizeDefaultIndex].value;
const DefaultBrush = Brushes[Config.brushTypeDefaultIndex];
const FoodValue = Brushes.find(brush => brush.name === "Food").value;
const HomeValue = Brushes.find(brush => brush.name === "Home").value;
const BorderWeight = Config.borderWeight;
const FrameRate = Config.FrameRate;
const PreloadMap = Config.PreloadMap;

export default class AntGame extends React.Component {
  static contextType = GameModeContext;

  constructor(props) {
    super(props);

    this.brushSize = BrushSizeDefault;
    this.brushType = DefaultBrush.value;
    this.windowSize = [];
    this.blockDrawing = false;
    this.imageToSave = "";

    this.timerHandler = new TimerHandler(this.handleChallengeTimeout, this.setTime);

    this.mapHandler = new MapHandler(this.toggleTimer);
    this.antHandler = new AntHandler(this.mapHandler);

    let emptyMap = true;
    if (PreloadMap && props.mapToLoad) {
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
      homeOnMap: 0,
    };

    this.homeTrailHandler = new TrailHandler(Brushes.find(brush => brush.value === HomeValue).color, this.mapHandler);
    this.foodTrailHandler = new TrailHandler(Brushes.find(brush => brush.value === FoodValue).color, this.mapHandler);
  }

  componentDidMount() {
    this.setMapUiUpdate(100);

    this.gamemode = this.context.mode;
    if (this.gamemode === "challenge") {
      const challengeID = this.context.challengeID;
      this.challengeHandler = ChallengeHandler;
      this.challengeHandler.challengeID = challengeID;
      this.challengeHandler.mapHandler = this.mapHandler;
      this.challengeHandler.timerHandler = this.timerHandler;

      this.setState({
        showChallengeModal: false,
      });
    }
    this.mapHandler.gameMode = this.gamemode;
    this.timerHandler.gameMode = this.gamemode;
    this.timerHandler.updateTimeDisplay(this.setTime);

    let bodyElement = document.querySelector("body");
    disableBodyScroll(bodyElement);
  }

  componentWillUnmount() {
    clearInterval(this.mapUiUpdateInterval);

    let bodyElement = document.querySelector("body");
    this.challengeHandler.clearConfig();
    enableBodyScroll(bodyElement);
  }

  setMapUiUpdate = mili => {
    if (this.mapUiUpdateInterval) clearInterval(this.mapUiUpdateInterval);
    this.mapUiUpdateInterval = setInterval(() => {
      this.setState({
        foodReturned: this.mapHandler.percentFoodReturned,
        homeOnMap: this.mapHandler.homeCellCount,
      });
    }, mili);
  };

  handleChallengeTimeout = () => {
    this.updatePlayState(false);
    this.challengeHandler.handleTimeout();
    this.setState({ showChallengeModal: true });
  };

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

  setupAndInitialize = p5 => {
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

  draw = p5 => {
    if (this.imageToSave !== "") this.handleImageSave(p5);

    if (this.state.shouldResizeCanvas) {
      this.resizeCanvas(p5);
      this.mapHandler.drawFullMap();
      this.homeTrailGraphic.clear();
      this.foodTrailGraphic.clear();
    }

    if (p5.mouseIsPressed) this.handleMousePressed(p5);

    if (this.mapHandler.redrawMap) this.mapHandler.drawMap();
    else if (this.mapHandler.redrawFullMap) this.mapHandler.drawFullMap();

    if (this.antHandler.redrawAnts) this.antHandler.drawAnts(this.antGraphic, this.antImage, this.antFoodImage);

    p5.image(this.backgroundGraphic, 0, 0);
    p5.image(this.homeTrailGraphic, 0, 0);
    p5.image(this.foodTrailGraphic, 0, 0);
    p5.image(this.mapGraphic, 0, 0);
    p5.image(this.antGraphic, 0, 0);
    p5.image(this.staticElements, 0, 0);

    if (this.state.loading) this.setState({ loading: false });
  };

  handleImageSave = p5 => {
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

  resizeCanvas = p5 => {
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

  handleMousePressed = p5 => {
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

  updateBrushSize = size => {
    this.brushSize = size;
  };

  updateBrushType = type => {
    this.brushType = type;
  };

  updatePlayState = state => {
    const IsChallenge = this.gamemode === "challenge";
    if (state) {
      if (this.state.emptyMap) return;
      if (this.mapHandler.homeCellCount === 0) return;
      if (IsChallenge && this.timerHandler.noTime) return "reset";
      this.setMapUiUpdate(500);
      this.toggleTimer(true);
      if (IsChallenge)
        this.challengeSnapshotInterval = setInterval(() => {
          this.challengeHandler.generateSnapshot();
        }, 5000);

      if (!this.antHandler.antsSpawned) {
        this.antHandler.spawnAnts(this.homeTrailHandler, this.foodTrailHandler);
        this.mapHandler.prepareForStart(IsChallenge);
        if (IsChallenge) {
          this.challengeHandler.handleStart(this.mapHandler.homeLocations);
          this.challengeHandler.generateSnapshot();
        }
      } else {
        this.mapHandler.findNewDecayableBlocks();
        this.mapHandler.calculateFoodToStopTime();
      }

      const ticksPerSecond = FrameRate * 1.5;
      const updateRate = 1000 / ticksPerSecond;
      this.updateCount = 0;
      this.gameLoopInterval = setInterval(() => {
        this.updateCount++;
        this.antHandler.updateAnts();
        if (this.updateCount % TrailDecayRate === 0) {
          this.foodTrailHandler.decayTrail();
          this.homeTrailHandler.decayTrail();
        }
        if (this.state.timerActive && this.updateCount % ticksPerSecond === 0) this.timerHandler.tickTime();
      }, updateRate);
    } else {
      clearInterval(this.challengeSnapshotInterval);
      clearInterval(this.gameLoopInterval);
      this.setMapUiUpdate(100);
      this.toggleTimer(false);
    }
    this.setState({ playState: state });
    GTMEmitter.PlayHandler(state);
  };

  toggleTimer = state => {
    if (state) {
      this.setState({ timerActive: true });
    } else {
      this.setState({
        timerActive: false,
        foodReturned: this.mapHandler.percentFoodReturned,
      });
    }
  };

  setTime = time => {
    this.setState({ time: time });
  };

  setMapName = mapName => {
    this.mapHandler.name = mapName;
  };

  clearMap = () => {
    const emptyMap = this.mapHandler.clearMap();
    if (emptyMap) this.setState({ emptyMap: true });
    this.reset();
    GTMEmitter.ClearHandler();
  };

  saveMapHandler = () => {
    this.mapHandler.saveMap();
    GTMEmitter.SaveHandler();
  };

  loadMapHandler = map => {
    if (this.mapHandler.loadMap(map)) this.setState({ emptyMap: false });
    GTMEmitter.LoadHandler();
  };

  resizeHandler = event => {
    if (event.windowWidth === this.windowSize[0] && event.windowHeight === this.windowSize[1]) {
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
      foodReturned: 0,
    });
    this.timerHandler.updateTimeDisplay(this.setTime);
  };

  resetHandler = () => {
    this.reset();
    GTMEmitter.ResetHandler();
  };

  saveImageHandler = imageToSave => {
    this.imageToSave = imageToSave;
    GTMEmitter.SaveImageHandler(imageToSave);
  };

  setBlockDraw = blockDrawing => {
    this.blockDrawing = blockDrawing;
  };

  loadSampleMap = () => {
    this.mapHandler.loadSampleMap().then(_ => this.reset());
    if (this.state.emptyMap) this.setState({ emptyMap: false });
    GTMEmitter.LoadSampleHandler();
  };

  closeChallengeModal = () => {
    this.setState({ showChallengeModal: false });
  };

  loadPRHomeLocations = () => {
    this.reset();
    ChallengeHandler.loadPRRun().then(result => {
      if (result !== false && this.state.emptyMap) this.setState({ emptyMap: false });
    });
  };

  render() {
    return (
      <div style={styles.container}>
        <ChallengeModal
          challengeHandler={this.challengeHandler}
          show={this.state.showChallengeModal}
          closeModal={() => this.closeChallengeModal()}
        />
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
              homeOnMap={this.state.homeOnMap}
              loadPRHandler={this.loadPRHomeLocations}
            />
          </div>
          <Sketch setup={this.setup} draw={this.draw} windowResized={this.resizeHandler} />
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
    padding: "2em 1em",
    backgroundColor: "#EBF5FB",
    height: "100vh",
  },
  centered: {
    textAlign: "center",
  },
};
