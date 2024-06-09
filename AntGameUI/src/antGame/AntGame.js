import React, { createRef } from "react";
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
import { GameModeContext } from "./GameModeContext";
import ChallengeHandler from "./Challenge/ChallengeHandler";
import ChallengeModal from "./AntGameHelpers/Challenge/ChallengeModal";
import cssStyles from "./Antgame.module.css";
import { DrawAnts } from "./AntGameHelpers/Graphics/AntGraphics";
import { MapGraphics } from "./AntGameHelpers/Graphics/MapGraphics";
import { TrailGraphics } from "./AntGameHelpers/Graphics/TrailGraphics";
import AuthHandler from "./Auth/AuthHandler";
import RunHistoryTab from "./AntGameHelpers/RunHistory/RunHistoryTab";
import { CompatibilityHelper } from "./Helpers/CompatibilityHelper";
import { SetPageDescription, SetPageTitle } from "./Helpers/DocumentHelpers";

let canvasW, canvasH;

const TrailDecayRate = Config.TrailDecayInterval;
const Brushes = Config.brushes;
const BrushSizeDefault = Config.brushSizes[Config.brushSizeDefaultIndex].value;
const DefaultBrush = Brushes[Config.brushTypeDefaultIndex];
const FoodValue = Brushes.find(b => b.name === "Food").value;
const HomeValue = Brushes.find(b => b.name === "Home").value;
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
    this.updateCount = 0;
    this.gameSpeed = 1;
    this.containerRef = createRef();

    this.timerHandler = new TimerHandler(this.handleChallengeTimeout, this.setTime);

    this.mapHandler = new MapHandler(this.toggleTimer);
    this.antHandler = new AntHandler();

    let emptyMap = true;
    if (PreloadMap && props.mapToLoad) {
      this.mapHandler.preloadMap(props.mapToLoad);
      emptyMap = false;
    }

    this.showHistoryTab = false;
    this.showHistoryTabSwitched = false;

    this.state = {
      emptyMap: emptyMap,
      playState: false,
      time: {
        min: "00",
        sec: "00",
      },
      timerActive: false,
      foodReturned: 0,
      homeOnMap: 0,
      speed: this.gameSpeed,
    };

    const homeColor = Brushes.find(b => b.value === HomeValue).color;
    this.homeTrailDrawer = new TrailGraphics(homeColor);
    this.homeTrailHandler = new TrailHandler(this.mapHandler, this.homeTrailDrawer);

    const foodColor = Brushes.find(b => b.value === FoodValue).color;
    this.foodTrailDrawer = new TrailGraphics(foodColor);
    this.foodTrailHandler = new TrailHandler(this.mapHandler, this.foodTrailDrawer);
  }

  componentDidMount() {
    this.setMapUiUpdate(100);

    this.gamemode = this.context.mode;
    if (this.gamemode === "challenge" || this.gamemode === "replay") {
      this.challengeID = this.context.challengeID;
      this.challengeHandler = ChallengeHandler;
      this.challengeHandler.gamemode = this.gamemode;
      this.challengeHandler.challengeID = this.challengeID;
      this.challengeHandler.mapHandler = this.mapHandler;
      this.challengeHandler.timerHandler = this.timerHandler;
      this.challengeHandler.antHandler = this.antHandler;
      this.challengeHandler.getConfig().then(config => {
        if (this.challengeID.toLowerCase() === "daily") {
          document.title = "Daily Challenge - AntGame";
          this.challengeID = config.id;
        } else document.title = `${config.name} - AntGame`;
      });

      this.setState({
        showChallengeModal: false,
      });
    } else if (this.gamemode === "sandbox") {
      SetPageTitle("Sandbox Mode - AntGame");
      SetPageDescription(
        "Build your own maps and watch the ants navigate them to find the food and bring it back home."
      );
    }

    this.mapHandler.gameMode = this.gamemode;
    this.timerHandler.gameMode = this.gamemode;
    this.timerHandler.updateTimeDisplay(this.setTime);

    for (let element of document.getElementsByClassName("react-p5")) {
      element.addEventListener("contextmenu", e => e.preventDefault());
    }

    let bodyElement = document.querySelector("body");
    disableBodyScroll(bodyElement);
  }

  componentWillUnmount() {
    clearInterval(this.mapUiUpdateInterval);
    clearInterval(this.challengeSnapshotInterval);
    clearInterval(this.gameLoopInterval);

    let bodyElement = document.querySelector("body");
    this.challengeHandler?.clearConfig();
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
    if (this.gamemode === "challenge") this.setState({ showChallengeModal: true });
  };

  setup = (p5, parentRef) => {
    this.parentRef = parentRef;

    this.antImage = p5.loadImage(AntSmol);
    this.antFoodImage = p5.loadImage(AntFoodSmol);

    this.setCanvasBounds(p5);

    this.antGraphic = p5.createGraphics(canvasW, canvasH);
    this.mapGraphic = p5.createGraphics(canvasW, canvasH);
    this.homeTrailGraphic = p5.createGraphics(canvasW, canvasH);
    this.foodTrailGraphic = p5.createGraphics(canvasW, canvasH);

    this.mapDrawer = new MapGraphics(this.mapGraphic);

    this.setupAndInitialize();

    this.homeTrailDrawer.graphics = this.homeTrailGraphic;
    this.foodTrailDrawer.graphics = this.foodTrailGraphic;

    p5.createCanvas(canvasW, canvasH).parent(parentRef);

    if (!this.mapHandler.mapSetup) this.mapHandler.generateMap();

    p5.frameRate(FrameRate);
  };

  setCanvasBounds = p5 => {
    if (this.readyToUpdateCanvasBounds()) {
      this.windowSize = [p5.windowWidth, p5.windowHeight];
      canvasW = p5.windowWidth - this.parentRef.offsetLeft - 16;
      canvasH = p5.windowHeight - this.parentRef.offsetTop - 20;

      this.showHistoryTabSwitched = false;
    }
  };

  readyToUpdateCanvasBounds = () => {
    let biggerThanMarginButSmallerThanHistoryTab = 100;

    const readyToOpen = this.showHistoryTab && this.parentRef.offsetLeft > biggerThanMarginButSmallerThanHistoryTab;
    const readyToClose = !this.showHistoryTab && this.parentRef.offsetLeft < biggerThanMarginButSmallerThanHistoryTab;
    return readyToOpen || readyToClose;
  };

  setupAndInitialize = () => {
    this.mapDrawer.setupMap(canvasW, canvasH);
    this.mapHandler.redrawMap = true;
  };

  draw = p5 => {
    if (this.imageToSave !== "") this.handleImageSave(p5);

    if (
      p5.windowWidth !== this.windowSize[0] ||
      p5.windowHeight !== this.windowSize[1] ||
      this.showHistoryTabSwitched
    ) {
      this.resizeCanvas(p5);
      this.containerRef.current.style.height = this.windowSize[1];
      this.mapDrawer.drawFullMap({ map: this.mapHandler.map });
      this.homeTrailDrawer.refreshSize();
      this.foodTrailDrawer.refreshSize();
    }

    if (p5.mouseIsPressed) this.handleClick(p5);

    if (this.mapHandler.redrawFullMap) {
      this.mapDrawer.drawFullMap({ map: this.mapHandler.map });
      this.mapHandler.redrawFullMap = false;

      if (this.mapHandler.shouldDrawFoodAmounts && this.mapHandler.foodAmounts)
        this.mapDrawer.drawFoodAmounts({ foodAmounts: this.mapHandler.foodAmounts });

      if (this.mapHandler.shouldDrawHomeAmounts) {
        this.mapDrawer.drawHomeAmounts({
          homeAmounts: this.mapHandler.homeAmounts,
          totalFood: this.mapHandler.totalFood,
        });
        this.mapHandler.homeAmountsDrawn = true;
      }
    } else if (this.mapHandler.redrawMap) {
      this.mapDrawer.drawMap({
        cellsToDraw: this.mapHandler.cellsToDraw,
        map: this.mapHandler.map,
      });
      this.mapHandler.cellsToDraw = [];
      this.mapHandler.redrawMap = false;

      if (this.mapHandler.shouldDrawFoodAmounts && this.mapHandler.foodAmounts)
        this.mapDrawer.drawFoodAmounts({ foodAmounts: this.mapHandler.foodAmounts });

      if (this.mapHandler.shouldDrawHomeAmounts && this.mapHandler.homeAmounts) {
        this.mapDrawer.drawHomeAmounts({
          homeAmounts: this.mapHandler.homeAmounts,
          totalFood: this.mapHandler.totalFood,
        });
        this.mapHandler.homeAmountsDrawn = true;
        if (this.gamemode !== "replay") this.mapHandler.shouldDrawHomeAmounts = false;
      } else {
        this.mapHandler.homeAmountsDrawn = false;
      }
    }

    if (this.antHandler.redrawAnts) {
      const ants = this.antHandler.ants;
      DrawAnts({
        graphics: this.antGraphic,
        ants,
        mapXYToCanvasXY: this.mapDrawer.mapXYToCanvasXY.bind(this.mapDrawer),
        antNoFoodImage: this.antImage,
        antFoodImage: this.antFoodImage,
      });
      this.antHandler.redrawAnts = false;
    }

    if (this.homeTrailHandler.hasPointsToDraw) this.homeTrailDrawer.drawPoints(this.homeTrailHandler);
    if (this.foodTrailHandler.hasPointsToDraw) this.foodTrailDrawer.drawPoints(this.foodTrailHandler);

    StaticElements.background(p5);
    p5.image(this.homeTrailGraphic, 0, 0);
    p5.image(this.foodTrailGraphic, 0, 0);
    p5.image(this.antGraphic, 0, 0);
    p5.image(this.mapGraphic, 0, 0);
    StaticElements.border(p5, BorderWeight, 0);
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
    this.setCanvasBounds(p5);
    this.setupAndInitialize();
    p5.resizeCanvas(canvasW, canvasH);
    this.antGraphic.resizeCanvas(canvasW, canvasH);
    this.mapGraphic.resizeCanvas(canvasW, canvasH);
    this.foodTrailGraphic.resizeCanvas(canvasW, canvasH);
    this.homeTrailGraphic.resizeCanvas(canvasW, canvasH);
  };

  handleClick = p5 => {
    if (this.gamemode === "replay") return;
    if (this.state.playState) return;
    if (this.blockDrawing) return;
    if (this.gamemode === "challenge" && this.updateCount !== 0) return;

    let mousePos = this.mapDrawer.canvasXYToMapXY([p5.mouseX, p5.mouseY]);

    if (this.mapHandler.mapXYInBounds(mousePos)) {
      if (p5.mouseButton === "right") {
        this.mapHandler.paintOnMap(mousePos, this.brushSize, " ");
        return;
      }
      this.mapHandler.paintOnMap(mousePos, this.brushSize, this.brushType);
      if (this.state.emptyMap) this.setState({ emptyMap: false });
    }
  };

  updateBrushSize = size => {
    this.brushSize = size;
  };

  updateBrushType = type => {
    this.brushType = type;
  };

  setCompatibilityDate = date => {
    this.homeTrailHandler.compatibilityDate = date;
    this.foodTrailHandler.compatibilityDate = date;
    this.mapHandler.compatibilityDate = date;
    this.antHandler.compatibilityDate = date;
  };

  updatePlayState = async state => {
    const IsChallenge = this.gamemode === "challenge";
    const IsReplay = this.gamemode === "replay";
    const IsSandbox = this.gamemode === "sandbox";
    if (state) {
      if (this.state.emptyMap) return;
      if (this.mapHandler.homeCellCount === 0) return;
      if ((IsChallenge || IsReplay) && this.timerHandler.noTime) this.reset();
      this.mapHandler.shouldDrawFoodAmounts = false;
      if (!this.antHandler.antsSpawned) {
        this.updateCount = 0;
        this.mapHandler.prepareForStart(IsChallenge);
        let seed = Math.round(Math.random() * 1e8);
        if (IsChallenge) {
          if (!AuthHandler.isAnon) {
            const seedInfo = await this.challengeHandler.getSeed({
              homeLocations: this.mapHandler.homeLocations,
            });
            if (seedInfo === false) {
              // TODO: Make modal to explain rate limit
              return;
            } else {
              seed = seedInfo.seed;
              this.setCompatibilityDate(seedInfo.compatibilityDate);
            }
          } else {
            this.challengeHandler._runSeed = seed;
            const compatibilityDate = CompatibilityHelper.getCompatibilityDate(new Date());
            this.challengeHandler._compatibilityDate = compatibilityDate;
            this.setCompatibilityDate(compatibilityDate);
          }
          this.challengeHandler.handleStart(this.mapHandler.homeLocations);
        } else if (IsReplay) {
          seed = this.challengeHandler._runSeed;
          this.setCompatibilityDate(this.challengeHandler._compatibilityDate);
        } else if (IsSandbox) {
          this.setCompatibilityDate(CompatibilityHelper.getCompatibilityDate(new Date()));
        }
        this.antHandler.spawnAnts({
          homeTrailHandler: this.homeTrailHandler,
          foodTrailHandler: this.foodTrailHandler,
          mapHandler: this.mapHandler,
          seed,
        });
      } else {
        this.mapHandler.findNewDecayableBlocks();
        this.mapHandler.calculateFoodToStopTime();
      }

      this.setMapUiUpdate(500);
      this.toggleTimer(true);
      if (!IsReplay) {
        this.showHistoryTab = false;
        this.showHistoryTabSwitched = true;
      }

      const ticksPerSecond = FrameRate * 1.5;
      const updateRate = Math.round(1000 / ticksPerSecond);
      clearInterval(this.gameLoopInterval);
      this.lastGameUpdateRunTime = new Date();
      let catchUpUpdates = 0;
      let keepGoing = true;
      let cumulativeError = 0;
      this.gameLoopInterval = setInterval(() => {
        const timeSinceLastRun = new Date().getTime() - this.lastGameUpdateRunTime.getTime();
        this.lastGameUpdateRunTime = new Date();

        const updateError = timeSinceLastRun / updateRate - 1;
        cumulativeError += updateError;
        if (timeSinceLastRun > 200) return;
        if (cumulativeError > 1) {
          const additionalUpdates = Math.floor(cumulativeError);
          catchUpUpdates += additionalUpdates;
          cumulativeError -= additionalUpdates;
        }

        let updates = this.gameSpeed;
        if (catchUpUpdates) {
          const updateCount = this.determineUpdateCount(catchUpUpdates);
          updates += updateCount;
          catchUpUpdates -= updateCount;
        }
        for (let count = 0; count < updates && keepGoing; count++) {
          this.updateCount++;
          this.antHandler.updateAnts();
          if (this.updateCount % TrailDecayRate === 0) {
            this.foodTrailHandler.decayTrailMap();
            this.foodTrailDrawer.decayTrail();
            this.homeTrailHandler.decayTrailMap();
            this.homeTrailDrawer.decayTrail();
          }
          if (this.state.timerActive && this.updateCount % ticksPerSecond === 0) {
            if (this.challengeHandler) this.challengeHandler.updateCount = this.updateCount;
            if (!this.timerHandler.tickTime()) keepGoing = false;
          }
        }
      }, updateRate);
    } else {
      clearInterval(this.challengeSnapshotInterval);
      clearInterval(this.gameLoopInterval);
      this.setMapUiUpdate(100);
      this.toggleTimer(false);
    }
    this.setState({ playState: state });
  };

  determineUpdateCount = catchUpUpdates => {
    if (catchUpUpdates > 450) return 10;
    else if (catchUpUpdates > 400) return 9;
    else if (catchUpUpdates > 350) return 8;
    else if (catchUpUpdates > 300) return 7;
    else if (catchUpUpdates > 250) return 6;
    else if (catchUpUpdates > 200) return 5;
    else if (catchUpUpdates > 150) return 4;
    else if (catchUpUpdates > 100) return 3;
    else if (catchUpUpdates > 50) return 2;
    else return 1;
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

  toggleShowHistoryTab = () => {
    this.showHistoryTab = !this.showHistoryTab;
    this.showHistoryTabSwitched = true;
  };

  setTime = time => {
    this.setState({ time: time });
  };

  setMapName = mapName => {
    this.mapHandler.name = mapName;
  };

  setGameSpeed = speed => {
    this.gameSpeed = speed;
    this.setState({ speed });
  };

  clearMap = () => {
    const emptyMap = this.mapHandler.clearMap();
    if (emptyMap) this.setState({ emptyMap: true });
    this.reset();
  };

  saveMapHandler = () => {
    this.mapHandler.saveMap();
  };

  loadMapHandler = map => {
    if (this.mapHandler.loadMap(map)) this.setState({ emptyMap: false });
  };

  reset = () => {
    this.antHandler.clearAnts();
    this.foodTrailHandler.clearTrails();
    this.foodTrailDrawer.clear();
    this.homeTrailHandler.clearTrails();
    this.homeTrailDrawer.clear();
    this.timerHandler.resetTime();
    this.mapHandler.handleReset();
    this.updateCount = 0;
    this.setState({
      foodReturned: 0,
    });
    this.timerHandler.updateTimeDisplay(this.setTime);
    this.mapHandler.shouldDrawFoodAmounts = true;
  };

  saveImageHandler = imageToSave => {
    this.imageToSave = imageToSave;
  };

  setBlockDraw = blockDrawing => {
    this.blockDrawing = blockDrawing;
  };

  loadMap = type => {
    if (type === "sample") {
      this.mapHandler.loadSampleMap().then(_ => this.reset());
    } else if (type === "generated") {
      this.mapHandler.fetchAndLoadMap("/api/map");
    } else {
      this.mapHandler.loadMap(type);
    }
    if (this.state.emptyMap) this.setState({ emptyMap: false });
  };

  closeChallengeModal = () => {
    this.setState({ showChallengeModal: false });
  };

  loadRecordHandler = type => {
    this.reset();
    ChallengeHandler.lookupAndLoadRun(type).then(result => {
      if (result !== false && this.state.emptyMap) this.setState({ emptyMap: false });
    });
    if (this.gamemode === "replay") {
      this.setState({ replayLabel: ChallengeHandler.replayLabel });
    }
  };

  loadRunHandler = run => {
    this.reset();
    ChallengeHandler.loadRun({ ...run, username: AuthHandler.username });
    this.setState({ emptyMap: false });
    if (this.gamemode === "replay") {
      this.setState({ replayLabel: ChallengeHandler.replayLabel });
    }
  };

  render() {
    return (
      <div className={cssStyles.container} ref={this.containerRef}>
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
              resetHandler={this.reset}
              clearMapHandler={this.clearMap}
              saveMapHandler={this.saveMapHandler}
              mapClear={this.state.emptyMap}
              brushSizeHandler={this.updateBrushSize}
              brushTypeHandler={this.updateBrushType}
              blockDrawHandler={this.setBlockDraw}
              saveImageHandler={this.saveImageHandler}
              loadMapHandler={this.loadMap}
              setMapNameHandler={this.setMapName}
              getMapName={() => this.mapHandler.mapName}
              foodReturned={this.state.foodReturned}
              homeOnMap={this.state.homeOnMap}
              loadRecordHandler={this.loadRecordHandler}
              replayLabel={this.state.replayLabel}
              speed={this.state.speed}
              setSpeed={this.setGameSpeed}
              toggleShowHistory={this.toggleShowHistoryTab}
            />
          </div>
          <div className={cssStyles.innerWindow}>
            {this.showHistoryTab && !AuthHandler.isAnon && (
              <RunHistoryTab
                challengeId={this.challengeID}
                loadRunHandler={run => this.loadRunHandler(run)}
                gameMode={this.gamemode}
                disabled={this.state.playState}
              ></RunHistoryTab>
            )}
            <Sketch setup={this.setup} draw={this.draw} />
          </div>
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
  centered: {
    textAlign: "center",
  },
};
