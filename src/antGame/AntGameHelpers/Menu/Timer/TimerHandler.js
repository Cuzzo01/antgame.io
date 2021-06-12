export class TimerHandler {
  constructor() {
    this.min = 0;
    this.sec = 0;
    this._startFrameCount = 0;
    this.lastFrameCount = 0;

    this.time = {
      min: "00",
      sec: "00",
    };
  }

  set startFrameCount(frameCount) {
    this._startFrameCount = frameCount;
  }

  resetTime() {
    this.min = 0;
    this.sec = 0;
    this.updateTime();
  }

  handleTime(frameCount, setTime) {
    if (this.frameCount !== frameCount) {
      this.frameCount = frameCount;
      this.sec++;
      this.updateTime();
      setTime(this.time);
    }
  }

  updateTime() {
    if (this.sec > 59) {
      this.min++;
      this.sec = 0;
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
