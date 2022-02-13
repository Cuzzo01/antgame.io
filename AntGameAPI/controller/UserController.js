const Logger = require("../Logger");
const UserHandler = require("../handler/UserHandler");

const getUserBadges = async (req, res) => {
  try {
    const userID = req.params.id;

    const { badges, ttl } = await UserHandler.getBadges(userID);

    if (ttl) {
      const maxCacheTime = 120;
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
