const { GetIpAddress } = require("../helpers/IpHelper");
const Logger = require("../Logger");

async function reportSpacesData(req, res) {
  try {
    Logger.log({
      message: "spaces load data",
      time: req.body.time,
      path: req.body.path,
      ip: GetIpAddress(req),
    });
    res.sendStatus(200);
  } catch (error) {
    Logger.logError("ReportController.reportSpacesData", error);
    res.sendStatus(500);
  }
}
module.exports = { reportSpacesData };
