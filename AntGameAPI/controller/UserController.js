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

    const badges = await UserHandler.getBadges(userID);
    const ttl = UserHandler.getBadgeTTL(userID);

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
    res.sendStatus(500);
  }
};

const getUserDetails = async (req, res) => {
  try {
    const userID = req.params.id;

    if (!userID) {
      res.sendStatus(400);
      return;
    }

    const userDetails = await UserHandler.getUserDetails(userID);
    const ttl = UserHandler.getDetailsTTL(userID);

    if (ttl) {
      const maxCacheTime = await FlagHandler.getFlagValue("time-to-cache-user-details");
      const age = maxCacheTime - ttl;
      res.set(`Cache-Control`, `public, max-age=${maxCacheTime}`);
      if (age > 0) res.set(`Age`, age);
    }

    res.send(userDetails);
  } catch (e) {
    Logger.logError("UserController.getUserDetails", e);
    res.sendStatus(500);
  }
};

module.exports = { getUserBadges, getUserDetails };
