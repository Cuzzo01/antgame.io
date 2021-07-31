import { Config } from "../config";
import { getChallengeConfig, getPRHomeLocations, getRecords, sendRunArtifact } from "./ChallengeService";
import { v4 as uuidV4 } from "uuid";
import AuthHandler from "../Auth/AuthHandler";

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
    this.prHomeLocations = false;
  }

  set mapHandler(mapHandler) {
    this._mapHandler = mapHandler;
    const config = this.config;
    if (config) {
      this._mapHandler.homeCellsAllowed = config.homeLimit;
      this._mapHandler.fetchAndLoadMap(config.mapPath);
    }
  }

  get isPB() {
    return this.artifact?.PB === true;
  }

  set timerHandler(timerHandler) {
    this._timerHandler = timerHandler;
  }

  set antHandler(antHandler) {
    this._antHandler = antHandler;
  }

  set challengeID(id) {
    this._challengeID = id;
    this.prHomeLocations = false;
    this.getConfig();
    this.getRecords();
  }

  get config() {
    if (this._config) return this._config;
    else return false;
  }

  async loadPRRun() {
    this._mapHandler.clearMap();
    if (this.prHomeLocations === false) {
      const locations = await getPRHomeLocations(this.config.id);
      if (this.prHomeLocations === null) return;
      this.prHomeLocations = locations;
    }
    this._mapHandler.setHomeLocations(this.prHomeLocations);
  }

  clearConfig() {
    this._config = null;
    this.records = false;
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
    if (this.loadingConfig) return this.configPromise;
    else {
      if (Config.Challenge.overrideServerConfig) {
        this._config = Config.Challenge.config;
        const config = Config.Challenge.config;
        this._mapHandler.homeCellsAllowed = config.homeLimit;
        this._mapHandler.fetchAndLoadMap(config.mapPath);
        this._timerHandler.defaultTime = config.seconds;
        this._timerHandler.resetTime();
        return config;
      } else if (Config.Challenge.overrideChallengeID) {
        this.challengeID = Config.ChallengeID;
      }
      this.loadingConfig = true;
      this.configPromise = getChallengeConfig(this._challengeID)
        .then(config => {
          this.loadingConfig = false;
          this._config = config;
          this._mapHandler.homeCellsAllowed = config.homeLimit;
          this._mapHandler.fetchAndLoadMap(config.mapPath);
          this._timerHandler.defaultTime = config.seconds;
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
    else if (this.loadingRecords) return this.recordsPromise;
    else {
      this.loadingRecords = true;
      this.recordsPromise = getRecords(this._challengeID).then(records => {
        this.loadingRecords = false;
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
    this.artifact.Timing = {
      SystemStartTime: new Date().getTime(),
    };
    this.artifact.Snapshots = [];
  }

  generateSnapshot() {
    const mapHandler = this._mapHandler;
    const time = this._timerHandler.displayTime;
    this.artifact.Snapshots.push([
      new Date().getTime(),
      `${time.min}:${time.sec}`,
      mapHandler.foodRatio,
      mapHandler.foodOnMap,
      mapHandler.foodInTransit,
    ]);
  }

  handleTimeout() {
    const mapHandler = this._mapHandler;
    this.score = Math.round(mapHandler.percentFoodReturned * 100000);

    if (!AuthHandler.isAnon && (!this.records?.pr || this.score > this.records.pr)) {
      this.artifact.PB = true;
      if (!this.records) this.records = {};
      this.records.pr = this.score;
      this.notifyRecordsListeners();
      this.prHomeLocations = this.artifact.HomeLocations;
    }

    this.generateSnapshot(mapHandler);
    this.artifact.GameConfig = {
      MapPath: this.config.mapPath,
      Time: this.config.seconds,
      spawnedAnts: this._antHandler.ants.length,
      FoodPerCell: this._mapHandler.foodPerCell,
      DirtPerCell: this._mapHandler.dirtPerCell,
    };

    this.artifact.Timing.SystemStopTime = new Date().getTime();
    this.artifact.FoodConsumed = mapHandler.foodToRespawn.length;
    this.artifact.Score = this.score;
    this.artifact.ClientID = this.clientID;

    this.sendArtifact();
  }

  async sendArtifact() {
    try {
      const response = await sendRunArtifact(this.artifact);
      let notify = false;
      if (response.wr) {
        this.records.wr = response.wr;
        this.checkForWrRun();
        notify = true;
      }
      if (response.rank) {
        this.records.rank = response.rank;
        notify = true;
      }
      if (notify) this.notifyRecordsListeners();
    } catch (e) {
      localStorage.setItem("artifactToSend", JSON.stringify(this.artifact));
    }
  }

  checkForWrRun() {
    if (this.records.wr.score === this.artifact.Score && this.records.wr.name === AuthHandler.username) {
      this.WrRun = true;
    }
    this.notifyWrListeners();
  }

  notifyWrListeners() {
    if (this.wrListeners) this.wrListeners.forEach(callback => callback(this.WrRun));
  }

  notifyRecordsListeners() {
    if (this.recordListeners) this.recordListeners.forEach(callback => callback(this.records));
  }
}

const SingletonInstance = new ChallengeHandler();
export default SingletonInstance;
