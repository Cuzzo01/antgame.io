class Logger {
  constructor() {
    this.logger = require("logzio-nodejs").createLogger({
      token: "UKOLffEwBTJxXdUzPkeIMzsVJkoUiLrs",
      protocol: "https",
      host: "listener.logz.io",
      port: "8071",
      type: "YourLogType",
    });
  }

  log(obj) {
    this.logger.log(obj);
  }
}
const SingletonInstance = new Logger();
module.exports = SingletonInstance;
