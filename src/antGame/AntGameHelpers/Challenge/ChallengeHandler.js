import { Config } from "../../config";

export class ChallengeHandler {
  constructor() {
    this.challengeName = Config.Challenge.Name;
    this.score = "Not Scored";
  }

  handleTimeout(mapHandler) {
    this.challengeName = this.challengeName;
    this.score = Math.round(mapHandler.percentFoodReturned * 100000);
  }
}
