const FlagHandler = require("../handler/FlagHandler");
const Logger = require("../Logger");

const getFlag = async (req, res) => {
  try {
    const name = req.params.name;
    const value = await FlagHandler.getFlagValue(name);
    if (value === null) {
      res.sendStatus(404);
      return;
    }

    const ttl = FlagHandler.getFlagTTL(name);
    if (ttl) {
      const maxAge = await FlagHandler.getFlagValue("timeToCacheFlags");
      const age = maxAge - ttl;
      res.set("Cache-Control", `public, max-age=${maxAge}`);
      if (age > 0) res.set("Age", age);
    }

    res.send(value);
  } catch (e) {
    Logger.logError("FlagController", e);
    res.sendStatus(500);
    return;
  }
};

module.exports = { getFlag };
