import { Config } from "../../../config";

const ChallengeMin = Config.Challenge.StartMin;
const ChallengeSec = Config.Challenge.StartSec;

export class TimerHandler {
  constructor(handleChallengeTimeout) {
    this.handleChallengeTimeout = handleChallengeTimeout;
    this.min = 0;
    this.sec = 0;
    this._startFrameCount = 0;
    this.lastFrameCount = 0;
    this.gameMode = "";

    this.time = {
      min: "00",
      sec: "00",
    };
  }

  get noTime() {
    return this.min === 0 && this.sec === 0;
  }

  set startFrameCount(frameCount) {
    this._startFrameCount = frameCount;
  }

  set gameMode(mode) {
    this._gameMode = mode;
    if (mode === "challenge") {
      this.min = ChallengeMin;
      this.sec = ChallengeSec;
    }
    this.updateTime();
  }

  setTime(setTime) {
    setTime(this.time);
  }

  resetTime() {
    if (this._gameMode === "challenge") {
      this.min = ChallengeMin;
      this.sec = ChallengeSec;
    } else {
      this.min = 0;
      this.sec = 0;
    }
    this.updateTime();
  }

  handleTime(frameCount, setTime) {
    if (this.frameCount !== frameCount) {
      this.frameCount = frameCount;
      if (this._gameMode === "challenge") {
        this.sec--;
        if (this.sec === 0 && this.min === 0) this.handleChallengeTimeout();
      } else this.sec++;
      this.updateTime();
      setTime(this.time);
    }
  }

  updateTime() {
    if (this.sec > 59) {
      this.min++;
      this.sec = 0;
    } else if (this.sec < 0) {
      this.min--;
      this.sec = 59;
    }
    this.time = {
      min:
        parseInt(this.min / 10) === 0
          ? "0" + this.min.toString()
          : this.min.toString(),
      sec:
        parseInt(this.sec / 10) === 0
          ? "0" + this.sec.toString()
          : this.sec.toString(),
    };
  }
}
