export class TimerHandler {
  constructor(handleChallengeTimeout, setDisplayTimeFunc) {
    this.handleChallengeTimeout = handleChallengeTimeout;
    this.setDisplayTimeFunc = setDisplayTimeFunc;
    this.min = 0;
    this.sec = 0;
    this._startFrameCount = 0;
    this.lastFrameCount = 0;
    this.gameMode = "";

    this._defaultTime = 0;

    this.displayTime = {
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
  }

  set defaultTime(time) {
    this._defaultTime = time;
  }

  set time(time) {
    this.min = time.min;
    this.sec = time.sec;
    this.updateDisplayTime();
    this.setDisplayTimeFunc(this.displayTime);
  }

  updateTimeDisplay() {
    this.setDisplayTimeFunc(this.displayTime);
  }

  resetTime() {
    this.min = parseInt(Math.floor(this._defaultTime / 60)) ?? 0;
    this.sec = parseInt(this._defaultTime % 60) ?? 0;
    this.updateDisplayTime();
    this.updateTimeDisplay();
  }

  tickTime() {
    const IsChallenge = this._gameMode === "challenge";
    if (IsChallenge) {
      this.sec--;
    } else this.sec++;
    this.updateDisplayTime();
    this.setDisplayTimeFunc(this.displayTime);
    if (IsChallenge && this.sec === 0 && this.min === 0) {
      this.handleChallengeTimeout();
      return false;
    }
    return true;
  }

  updateDisplayTime() {
    if (this.sec > 59) {
      this.min++;
      this.sec = 0;
    } else if (this.sec < 0) {
      this.min--;
      this.sec = 59;
    }
    this.displayTime = {
      min: parseInt(this.min / 10) === 0 ? "0" + this.min.toString() : this.min.toString(),
      sec: parseInt(this.sec / 10) === 0 ? "0" + this.sec.toString() : this.sec.toString(),
    };
  }
}
