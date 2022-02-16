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
    let errString = err && err.stack ? err.stack : err;
    this.log({ message: "API Error", location: location, error: errString });
  }

  logAuthEvent(event, data) {
    this.log({ message: "Auth Event", event: event, ...data });
  }

  logCacheResult(cacheName, cacheMiss, key, value, time) {
    const toLog = {
      message: "Cache Result",
      cacheName,
      resultType: cacheMiss ? "miss" : "hit",
      key: key,
      time: time,
    };

    if (value && value.length) toLog.value = value;
    this.log(toLog);
  }

  logCronMessage(message) {
    this.log({
      message: "Daily challenge cron",
      cronMessage: message,
    });
  }

  logDBCleanupMessage(name, deletedCount) {
    this.log({ message: "db cleanup cron", name: name, deleted: deletedCount });
  }
}
const SingletonInstance = new Logger();
module.exports = SingletonInstance;
