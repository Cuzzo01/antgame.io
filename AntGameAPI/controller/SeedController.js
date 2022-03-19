const { SeedBroker } = require("../bll/SeedBroker");
const Logger = require("../Logger");

async function getSeed(req, res) {
  try {
    const homeLocations = req.body.homeLocations;
    const userID = req.user.id;

    if (homeLocations.length === 0) res.sendStatus(400);

    const seed = await SeedBroker.getSeed({ homeLocations, userID });

    res.send({ seed });
  } catch (e) {
    Logger.logError("SeedController.getSeed", e);
    res.sendStatus(500);
  }
}
module.exports = { getSeed };
