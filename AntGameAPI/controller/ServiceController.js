const Logger = require("../Logger");

async function rejectRun(req, res) {
  try {
    console.log(req.body.runID);
    res.sendStatus(200);
  } catch (e) {
    Logger.logError("ServiceController.rejectRun", e);
    res.sendStatus(500);
  }
}

module.exports = { rejectRun };
