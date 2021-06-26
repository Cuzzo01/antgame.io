import { Config } from "../../config";

export class ChallengeHandler {
  constructor() {
    this.challengeName = Config.Challenge.Name;
    this.score = "Not Scored";
  }

  handleTimeout(mapHandler) {
    this.challengeName = "Map A - 2:30";
    this.score = Math.round(mapHandler.percentFoodReturned * 100000);
  }
}
