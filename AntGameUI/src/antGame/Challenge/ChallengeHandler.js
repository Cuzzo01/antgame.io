import { Config } from "../config";
import {
  getChallengeConfig,
  getRecords,
  sendRunArtifact,
} from "../AntGameHelpers/Services/ChallengeService";
import { v4 as uuidV4 } from "uuid";
import AuthHandler from "../Auth/AuthHandler";

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
    this.records = false;
    this.recordsPromise = false;
    this.WrRun = false;
    this.recordListeners = [];
    this.wrListeners = [];
  }

  set mapHandler(mapHandler) {
    this._mapHandler = mapHandler;
  }

  get isPB() {
    return this.artifact?.PB === true;
  }

  set timerHandler(timerHandler) {
    this._timerHandler = timerHandler;
  }

  set challengeID(id) {
    this._challengeID = id;
    this.getConfig();
    this.getRecords();
  }

  get config() {
    if (this._config) return this._config;
    else return false;
  }

  addRecordListener(callback) {
    this.recordListeners.push(callback);
    if (this.records) callback(this.records);
  }

  addWrListener(callback) {
    this.wrListeners.push(callback);
  }

  async getConfig() {
    if (this._config) return this._config;
    if (this.loading) return this.configPromise;
    else {
      if (Config.Challenge.overrideServerConfig) {
        this._config = Config.Challenge.config;
        const config = Config.Challenge.config;
        this._mapHandler.homeCellsAllowed = config.homeLimit;
        this._mapHandler.fetchAndLoadMap(config.mapPath);
        this._timerHandler.defaultTime = config.time;
        this._timerHandler.resetTime();
        return config;
      } else if (Config.Challenge.overrideChallengeID) {
        this.challengeID = Config.ChallengeID;
      }
      this.loading = true;
      this.configPromise = getChallengeConfig(this._challengeID)
        .then((config) => {
          this.loading = false;
          this._config = config;
          this._mapHandler.homeCellsAllowed = config.homeLimit;
          this._mapHandler.fetchAndLoadMap(config.mapPath);
          this._timerHandler.defaultTime = config.time;
          this._timerHandler.resetTime();
          return config;
        })
        .catch(() => {
          window.location = "/challenge";
        });
      return this.configPromise;
    }
  }

  async getRecords() {
    if (this.records) return this.records;
    else if (this.recordsPromise) return this.recordsPromise;
    else {
      this.recordsPromise = getRecords(this._challengeID).then((records) => {
        this.records = records;
        this.notifyRecordsListeners();
        return records;
      });
    }
  }

  setEnv() {
    this.env = "PROD";
    const hostName = window.location.hostname;
    if (hostName.startsWith("dev")) this.env = "DEV";
    else if (hostName.startsWith("localhost")) this.env = "LOCAL";
  }

  handleStart(homeLocations) {
    if (this.WrRun) {
      this.WrRun = false;
      this.notifyWrListeners();
    }

    const config = this.config;
    this.artifact = {};
    this.artifact.HomeLocations = homeLocations;
    this.artifact.Name = config.name;
    this.artifact.Env = this.env;
    this.artifact.challengeID = this._challengeID;
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
    const timerHandler = this._timerHandler;
    this.artifact.Snapshots.push({
      ST: new Date().getTime(),
      GT: timerHandler.displayTime,
      FR: mapHandler.foodRatio,
      FoM: mapHandler.foodOnMap,
      FiT: mapHandler.foodInTransit,
    });
  }

  handleTimeout() {
    const mapHandler = this._mapHandler;
    this.score = Math.round(mapHandler.percentFoodReturned * 100000);

    if (
      !AuthHandler.isAnon &&
      (!this.records?.pb || this.score > this.records.pb)
    ) {
      this.artifact.PB = true;
      if (!this.records) this.records = {};
      this.records.pb = this.score;
      this.notifyRecordsListeners();
    }

    this.generateSnapshot(mapHandler);

    this.artifact.Timing.SystemStopTime = new Date().getTime();
    this.artifact.FoodConsumed = mapHandler.foodToRespawn.length;
    this.artifact.Score = this.score;
    this.artifact.ClientID = this.clientID;

    this.sendArtifact();
  }

  async sendArtifact() {
    const response = await sendRunArtifact(this.artifact);
    if (response.wr) {
      this.records.wr = response.wr;
      this.checkForWrRun();
      this.notifyRecordsListeners();
    }
  }

  checkForWrRun() {
    if (
      this.records.wr.score === this.artifact.Score &&
      this.records.wr.name === AuthHandler.username
    ) {
      this.WrRun = true;
    }
    this.notifyWrListeners();
  }

  notifyWrListeners() {
    if (this.wrListeners)
      this.wrListeners.forEach((callback) => callback(this.WrRun));
  }

  notifyRecordsListeners() {
    if (this.recordListeners)
      this.recordListeners.forEach((callback) => callback(this.records));
  }
}

const SingletonInstance = new ChallengeHandler();
export default SingletonInstance;
