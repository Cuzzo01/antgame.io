import { Config } from "../../config";
import {
  getChallengeConfig,
  sendRunArtifact,
} from "../Services/ChallengeService";
import { v4 as uuidV4 } from "uuid";

const AntsToSpawn = Config.AntsToSpawn;
const FoodPerCell = Config.FoodPerCell;
const DirtPerCell = Config.DirtPerCell;

class ChallengeHandler {
  constructor() {
    this.clientID = localStorage.getItem("client-id");
    if (!this.clientID) {
      this.clientID = uuidV4();
      localStorage.setItem("client-id", this.clientID);
    }
    this.setEnv();
    this.score = "Not Scored";
  }

  set mapHandler(mapHandler) {
    this._mapHandler = mapHandler;
  }

  set timerHandler(timerHandler) {
    this._timerHandler = timerHandler;
  }

  get config() {
    if (this._config) return this._config;
    else return false;
  }

  async getConfig() {
    if (this.loading) return this.configPromise;
    if (this._config) return this._config;
    else {
      if (Config.Challenge.overrideServerConfig) {
        this._config = Config.Challenge.config;
        const config = Config.Challenge.config;
        this._mapHandler.homeCellsAllowed = config.homeLimit;
        this._mapHandler.fetchAndLoadMap(config.mapPath);
        this._timerHandler.defaultTime = config.time;
        this._timerHandler.resetTime();
        return config;
      }
      this.loading = true;
      this.configPromise = getChallengeConfig().then((config) => {
        this.loading = false;
        this._config = config;
        this._mapHandler.homeCellsAllowed = config.homeLimit;
        this._mapHandler.fetchAndLoadMap(config.mapPath);
        this._timerHandler.defaultTime = config.time;
        this._timerHandler.resetTime();
        return config;
      });
      return this.configPromise;
    }
  }

  setEnv() {
    this.env = "PROD";
    const hostName = window.location.hostname;
    if (hostName.startsWith("dev")) this.env = "DEV";
    else if (hostName.startsWith("localhost")) this.env = "LOCAL";
  }

  handleStart(homeLocations) {
    const config = this.config;
    this.artifact = {};
    this.artifact.HomeLocations = homeLocations;
    this.artifact.Name = config.name;
    this.artifact.Env = this.env;
    this.artifact.GameConfig = {
      MapPath: config.mapPath,
      Time: config.time,
      AntsToSpawn: AntsToSpawn,
      FoodPerCell: FoodPerCell,
      DirtPerCell: DirtPerCell,
    };
    this.artifact.Timing = {
      SystemStartTime: new Date().getTime(),
    };
    this.artifact.Snapshots = [];
  }

  generateSnapshot() {
    const mapHandler = this._mapHandler;
    this.artifact.Snapshots.push({
      T: new Date().getTime(),
      FR: mapHandler.foodRatio,
      FoM: mapHandler.foodOnMap,
      FiT: mapHandler.foodInTransit,
    });
  }

  handleTimeout() {
    const mapHandler = this._mapHandler;
    this.score = Math.round(mapHandler.percentFoodReturned * 100000);

    this.generateSnapshot(mapHandler);

    this.artifact.Timing.SystemStopTime = new Date().getTime();
    this.artifact.FoodConsumed = mapHandler.foodToRespawn.length;
    this.artifact.Score = this.score;
    this.artifact.ClientID = this.clientID;

    sendRunArtifact(this.artifact);
  }
}

const SingletonInstance = new ChallengeHandler();
export default SingletonInstance;
