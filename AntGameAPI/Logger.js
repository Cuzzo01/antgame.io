class Logger {
  constructor() {
    this.logger = require("logzio-nodejs").createLogger({
      token: "UKOLffEwBTJxXdUzPkeIMzsVJkoUiLrs",
      protocol: "https",
      host: "listener.logz.io",
      port: "8071",
      type: "YourLogType",
    });

    this.env = process.env.environment;
    if (this.env === undefined) {
      this.env = "NO ENV SET";
    }
  }

  log(obj) {
    this.logger.log({ ...obj, env: this.env });
  }
}
const SingletonInstance = new Logger();
module.exports = SingletonInstance;
