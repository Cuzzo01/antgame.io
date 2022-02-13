const Logger = require("../Logger");
const UserHandler = require("../handler/UserHandler");
const FlagHandler = require("../handler/FlagHandler");

const getUserBadges = async (req, res) => {
  try {
    const userID = req.params.id;

    if (!userID) {
      res.sendStatus(400);
      return;
    }

    const { badges, ttl } = await UserHandler.getBadges(userID);

    if (ttl) {
      const maxCacheTime = await FlagHandler.getFlagValue("time-to-cache-badges-external");
      const age = maxCacheTime - ttl;
      res.set(`Cache-Control`, `public, max-age=${maxCacheTime}`);
      if (age > 0) res.set(`Age`, age);
    }

    if (badges) res.send(badges);
    else res.send([]);
  } catch (e) {
    Logger.logError("UserController.getUserBadges", e);
    res.send(500);
  }
};

module.exports = { getUserBadges };
