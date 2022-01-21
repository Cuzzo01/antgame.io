const FlagHandler = require("./handler/FlagHandler");

class Logger {
  constructor() {
    this.logger = require("logzio-nodejs").createLogger({
      token: "UKOLffEwBTJxXdUzPkeIMzsVJkoUiLrs",
      protocol: "https",
      host: "listener.logz.io",
      port: "8071",
      type: "AntGameAPI",
    });
  }

  init() {
    this.env = process.env.environment;
    if (this.env === undefined) {
      this.env = "NO ENV SET";
    }
  }

  log(obj) {
    if (!this.env) this.init();
    if (this.env !== "LOCAL") {
      this.logger.log({ ...obj, env: this.env });
    } else {
      console.log(JSON.stringify(obj));
    }
  }

  logError(location, err) {
    this.log({ message: "API Error", location: location, error: err });
  }

  logAuthEvent(event, data) {
    this.log({ message: "Auth Event", event: event, ...data });
  }

  async logCacheResult(cacheName, cacheMiss, key, value, time) {
    this.log({
      message: "Cache Result",
      cacheName: cacheName,
      resultType: cacheMiss ? "miss" : "hit",
      key: key,
      value: value,
      time: time,
    });
  }
}
const SingletonInstance = new Logger();
module.exports = SingletonInstance;
