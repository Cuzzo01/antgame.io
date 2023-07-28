class Logger {
  constructor() {
    if (process.env.logzio_token)
      this.logger = require("logzio-nodejs").createLogger({
        token: process.env.logzio_token,
        protocol: "https",
        host: "listener.logz.io",
        port: "8071",
        type: "RunVerifier",
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
      console.log(new Date().toISOString(), JSON.stringify(obj));
    }
  }

  logError(location, err) {
    let errString = err && err.stack ? err.stack : err;
    this.log({ message: "API Error", location: location, error: errString });
  }

  logVerificationMessage({ message, time, result, traceID, runID, count, nextRunTime }) {
    this.log({
      message: "Verification",
      update: message,
      time,
      result,
      traceID,
      runID,
      count,
      nextRunTime,
    });
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
}
const SingletonInstance = new Logger();
module.exports = SingletonInstance;
