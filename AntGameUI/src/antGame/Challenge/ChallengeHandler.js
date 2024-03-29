import { Config } from "../config";
import {
  getChallengeConfig,
  getPRInfo,
  getRecords,
  getReplayConfig,
  getSeed,
  sendRunArtifact,
} from "./ChallengeService";
import AuthHandler from "../Auth/AuthHandler";

class ChallengeHandler {
  constructor() {
    this.setEnv();
    this.score = "Not Scored";
    this.records = false;
    this.recordsPromise = false;
    this.recordListeners = [];
    this.runResponseListeners = [];
    this.prInfo = false;
    this.lastSeenUpdateCount = 0;
  }

  set mapHandler(mapHandler) {
    this._mapHandler = mapHandler;
    const config = this.config;
    if (config) {
      this._mapHandler.homeCellsAllowed = config.homeLimit;
      this._mapHandler.fetchAndLoadMap(config.mapPath);
    }
  }

  set updateCount(count) {
    this.lastSeenUpdateCount = count;
  }

  set timerHandler(timerHandler) {
    this._timerHandler = timerHandler;
  }

  set antHandler(antHandler) {
    this._antHandler = antHandler;
  }

  set challengeID(id) {
    this._challengeID = id;
    this.prInfo = false;
    this.getConfig();
  }

  set config(config) {
    if (config.active === false && AuthHandler.isAdmin !== true && this._gamemode === "challenge") {
      window.location = "/";
    }
    this._config = config;
    this._mapHandler.homeCellsAllowed = config.homeLimit;
    this._mapHandler.fetchAndLoadMap(config.mapPath);
    this._timerHandler.defaultTime = config.seconds;
    this._timerHandler.resetTime();
  }

  set gamemode(gamemode) {
    this._gamemode = gamemode;
  }

  get replayLabel() {
    return this._label;
  }

  get config() {
    if (this._config) return this._config;
    else return false;
  }

  get isPB() {
    return this.artifact?.PB === true;
  }

  async lookupAndLoadRun(type) {
    this._mapHandler.clearMap();
    if (this._gamemode === "challenge") {
      if (this.prInfo === false) {
        const info = await getPRInfo(this.config.id);
        if (this.prInfo === null) return;
        this.prInfo = info;
      }
      this.loadRun(this.prInfo);
    } else if (this._gamemode === "replay") {
      if (type === "pr") {
        this.loadRun({ ...this.config.prData, username: AuthHandler.username }, type);
      } else if (type === "wr") {
        this.loadRun({ ...this.config.wrData, username: this.records.wr.name }, type);
      }
    }
  }

  loadRun(run, type) {
    this._mapHandler.clearMap();
    if (this._gamemode === "replay") {
      this._runSeed = run.seed;
      this._compatibilityDate = run.compatibilityDate;
      this.setReplayLabel(type, run.score, run.username);
    }
    this._mapHandler.setHomeLocations({
      locations: run.locations,
      amounts: run.amounts,
    });
  }

  setReplayLabel(type, score, username) {
    this._label = `${username} - ${score}`;

    if (type) {
      this._label += `| ${type.toUpperCase()}`;
    }
  }

  clearConfig() {
    this._config = null;
    this.records = false;
  }

  addRecordListener(callback) {
    const index = this.recordListeners.length;
    this.recordListeners.push(callback);
    if (this.records) callback(this.records);
    return index;
  }

  addRunResponseListener(callback) {
    const index = this.runResponseListeners.length;
    this.runResponseListeners.push(callback);
    return index;
  }

  removeRecordListener(id) {
    this.recordListeners[id] = null;
  }

  removeRunResponseListener(id) {
    this.runResponseListeners[id] = null;
  }

  clearResendTimeout() {
    if (this.resendTimeout) clearTimeout(this.resendTimeout);
  }

  async getConfig() {
    if (this._config) return this._config;
    if (this.loadingConfig) return this.configPromise;
    else {
      if (Config.Challenge.overrideServerConfig) {
        const config = Config.Challenge.config;
        this.config = config;
        return config;
      } else if (Config.Challenge.overrideChallengeID) {
        this.challengeID = Config.ChallengeID;
      }
      this.loadingConfig = true;

      if (this._gamemode === "challenge") {
        this.configPromise = getChallengeConfig(this._challengeID).then(config => {
          this.loadingConfig = false;
          this.config = config;
          this.getRecords();
          return config;
        });
      } else if (this._gamemode === "replay") {
        this.configPromise = getReplayConfig(this._challengeID).then(config => {
          this.loadingConfig = false;
          this.config = config;
          this.getRecords();
          return config;
        });
      }
    }

    return this.configPromise;
  }

  async getRecords() {
    if (this.records) return this.records;
    else if (this.loadingRecords) return this.recordsPromise;
    else {
      this.loadingRecords = true;
      this.recordsPromise = getRecords(this.config.id).then(records => {
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
    this.notifyRunResponseListener(false);
    if (this.resendTimeout) {
      clearTimeout(this.resendTimeout);
      this.resendTimeout = 0;
    }

    const config = this.config;
    this.artifact = {};
    this.artifact.HomeLocations = homeLocations;
    this.artifact.Name = config.name;
    this.artifact.Env = this.env;
    this.artifact.challengeID = this.config.id;
    this.artifact.Timing = {
      SystemStartTime: new Date().getTime(),
    };
    this.artifact.Snapshots = {};

    this.lastSeenUpdateCount = 0;
    this.generateSnapshot({ name: "start" });
  }

  generateSnapshot({ name }) {
    const mapHandler = this._mapHandler;
    const time = this._timerHandler.min * 60 + this._timerHandler.sec;
    this.artifact.Snapshots[name] = [
      new Date().getTime(),
      time,
      mapHandler.percentFoodReturned,
      mapHandler.foodOnMap,
      mapHandler.foodInTransit,
      JSON.stringify(mapHandler.homeFoodCounts),
      this.lastSeenUpdateCount,
    ];
  }

  handleTimeout() {
    const IsReplay = this._gamemode === "replay";
    if (IsReplay) return;

    const mapHandler = this._mapHandler;
    this.score = Math.round(mapHandler.percentFoodReturned * 100000);

    this.generateSnapshot({ name: "finish" });
    if (!AuthHandler.isAnon && (!this.records?.pr || this.score > this.records.pr)) {
      this.artifact.PB = true;
      if (!this.records) this.records = {};
      this.records.pr = this.score;
      this.notifyRecordsListeners();
      this.prInfo = {
        locations: this.artifact.HomeLocations,
        amounts: mapHandler.homeFoodCounts,
      };
    }

    this.artifact.GameConfig = {
      MapPath: this.config.mapPath,
      Time: this.config.seconds,
      spawnedAnts: this._antHandler.ants.length,
      FoodPerCell: this._mapHandler.foodPerCell,
      DirtPerCell: this._mapHandler.dirtPerCell,
      seed: this._runSeed,
      compatibilityDate: this._compatibilityDate,
    };

    this.artifact.Timing.SystemStopTime = new Date().getTime();
    this.artifact.FoodConsumed = mapHandler.foodToRespawn.length;
    this.artifact.Score = this.score;
    this.artifact.ClientID = AuthHandler.clientID;

    this.sendArtifact();
    mapHandler.setHomeAmounts(mapHandler.homeFoodCounts);
  }

  async sendArtifact() {
    try {
      const { result, resetTime } = await sendRunArtifact(this.artifact);

      if (result === "rateLimit") {
        if (this.resendTimeout) clearTimeout(this.resendTimeout);
        this.resendTimeout = setTimeout(() => this.sendArtifact(), resetTime * 1000);
      }

      this.notifyRunResponseListener(result, resetTime);

      if (result.rank) this.records.rank = result.rank;
      if (result.playerCount) this.records.playerCount = result.playerCount;
      if (result.wr) this.records.wr = result.wr;
      if (result.pr && this.records.pr !== result.pr) {
        this.records.pr = result.pr;
        this.prInfo = false;
      }

      this.notifyRecordsListeners();
    } catch (e) {
      localStorage.setItem("artifactToSend", JSON.stringify(this.artifact));
    }
  }

  notifyRunResponseListener(response, resetTime) {
    if (this.runResponseListeners)
      this.runResponseListeners.forEach(callback => {
        if (callback) callback(response, resetTime);
      });
  }

  notifyRecordsListeners() {
    if (this.recordListeners)
      this.recordListeners.forEach(callback => {
        if (callback) callback(this.records);
      });
  }

  async getSeed({ homeLocations }) {
    const data = await getSeed({ homeLocations });
    if (data.seed) this._runSeed = data.seed;
    if (data.compatibilityDate) this._compatibilityDate = data.compatibilityDate;
    else this._compatibilityDate = false;
    return data;
  }
}

const SingletonInstance = new ChallengeHandler();
export default SingletonInstance;
