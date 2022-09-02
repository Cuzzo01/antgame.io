import { Config } from "../config";
import {
  getChallengeConfig,
  getPreviousRunData,
  getPRInfo,
  getRecords,
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

    this.latestRunHistoryTime = new Date();
    this.previousRuns = [];
    this.itemsToGrab = 10;
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
    this.prInfo = false;
    this.getConfig();
  }

  set config(config) {
    if (config.active === false && AuthHandler.isAdmin !== true) {
      window.location = "/";
    }
    this._config = config;
    this._mapHandler.homeCellsAllowed = config.homeLimit;
    this._mapHandler.fetchAndLoadMap(config.mapPath);
    this._timerHandler.defaultTime = config.seconds;
    this._timerHandler.resetTime();
  }

  get config() {
    if (this._config) return this._config;
    else return false;
  }

  async loadPRRun() {
    this._mapHandler.clearMap();
    if (this.prInfo === false) {
      const info = await getPRInfo(this.config.id);
      if (this.prInfo === null) return;
      this.prInfo = info;
    }
    this._mapHandler.setLocationInfo(this.prInfo);
  }

  async loadHistoricalRun({index}) {
    this._mapHandler.clearMap();
    if (this.previousRuns.length < index + 1) {
      await this.getPreviousRuns(index - this.getPreviousRuns.length + 1);
      if (this.previousRuns.length < index + 1) {
        return;
      }
    }
    let run = this.previousRuns[index];
    this._mapHandler.setLocationInfo({locations: run.homeLocations, amounts: run.homeAmounts});
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
      this.configPromise = getChallengeConfig(this._challengeID).then(config => {
        this.loadingConfig = false;
        this.config = config;
        this.getRecords();
        return config;
      });
      return this.configPromise;
    }
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

  async getPreviousRuns(itemsToGrab = 10 ) {
  if (this.loadingPreviousRuns) return this.previousRunsPromise;
    else {
      this.loadingPreviousRuns = true;
      this.previousRunsPromise = getPreviousRunData({challengeId: this._challengeID, timeBefore: this.latestRunHistoryTime, itemsToGrab }).then(locationHistory => {
        this.loadingPreviousRuns = false;
        this.previousRuns = this.previousRuns.concat(...locationHistory);
        this.latestRunHistoryTime = new Date(this.previousRuns[this.previousRuns.length - 1].submissionTime);
        return this.loadingPreviousRuns;
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

    clearInterval(this.snapshotInterval);
    this.artifact.GameConfig = {
      MapPath: this.config.mapPath,
      Time: this.config.seconds,
      spawnedAnts: this._antHandler.ants.length,
      FoodPerCell: this._mapHandler.foodPerCell,
      DirtPerCell: this._mapHandler.dirtPerCell,
      seed: this._runSeed,
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
      const response = await sendRunArtifact(this.artifact);

      this.notifyRunResponseListener(response);

      if (response.rank) this.records.rank = response.rank;
      if (response.playerCount) this.records.playerCount = response.playerCount;
      if (response.wr) this.records.wr = response.wr;
      if (response.pr && this.records.pr !== response.pr) {
        this.records.pr = response.pr;
        this.prInfo = false;
      }

      this.notifyRecordsListeners();
    } catch (e) {
      localStorage.setItem("artifactToSend", JSON.stringify(this.artifact));
    }
  }

  notifyRunResponseListener(response) {
    if (this.runResponseListeners)
      this.runResponseListeners.forEach(callback => {
        if (callback) callback(response);
      });
  }

  notifyRecordsListeners() {
    if (this.recordListeners)
      this.recordListeners.forEach(callback => {
        if (callback) callback(this.records);
      });
  }

  async getSeed({ homeLocations }) {
    const seed = await getSeed({ homeLocations });
    if (seed) this._runSeed = seed;
    return seed;
  }
}

const SingletonInstance = new ChallengeHandler();
export default SingletonInstance;
