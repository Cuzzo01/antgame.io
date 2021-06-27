import { Config } from "../../config";
import { sendRunArtifact } from "../Services/ChallengeService";
import { v4 as uuidV4 } from "uuid";

const ChallengeName = Config.Challenge.Name;
const MapPath = Config.Challenge.MapPath;
const TimeMin = Config.Challenge.StartMin;
const TimeSec = Config.Challenge.StartSec;
const AntsToSpawn = Config.AntsToSpawn;
const FoodPerCell = Config.FoodPerCell;
const DirtPerCell = Config.DirtPerCell;

export class ChallengeHandler {
  constructor() {
    this.clientID = localStorage.getItem("client-id");
    if (!this.clientID) {
      this.clientID = uuidV4();
      localStorage.setItem("client-id", this.clientID);
    }
    this.env = "PROD";
    if (window.location.hostname.startsWith("dev")) this.env = "DEV"
    else if (window.location.hostname.startsWith("localhost")) this.env = "LOCAL"
    this.challengeName = Config.Challenge.Name;
    this.score = "Not Scored";
  }

  handleStart(homeLocations) {
    this.artifact = {};
    this.artifact.HomeLocations = homeLocations;
    this.artifact.Name = ChallengeName;
    this.artifact.Env = this.env
    this.artifact.GameConfig = {
      MapPath: MapPath,
      Time: { min: TimeMin, sec: TimeSec },
      AntsToSpawn: AntsToSpawn,
      FoodPerCell: FoodPerCell,
      DirtPerCell: DirtPerCell,
    };
    this.artifact.Timing = {
      SystemStartTime: new Date().getTime(),
    };
    this.artifact.Snapshots = [];
  }

  generateSnapshot(mapHandler) {
    this.artifact.Snapshots.push({
      T: new Date().getTime(),
      FR: mapHandler.foodRatio,
      FoM: mapHandler.foodOnMap,
      FiT: mapHandler.foodInTransit,
    });
  }

  handleTimeout(mapHandler) {
    this.score = Math.round(mapHandler.percentFoodReturned * 100000);

    this.generateSnapshot(mapHandler);

    this.artifact.Timing.SystemStopTime = new Date().getTime();
    this.artifact.FoodConsumed = mapHandler.foodToRespawn.length;
    this.artifact.Score = this.score;
    this.artifact.ClientID = this.clientID;

    sendRunArtifact(this.artifact);
  }
}
