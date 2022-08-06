const Logger = require("../Logger");
const UserHandler = require("../handler/UserHandler");

async function getUserBadges(req, res) {
  try {
    const userList = req.body.userList;

    if (!userList || userList.length > 100) {
      res.sendStatus(400);
      return;
    }

    let badgeResponse = {};
    for (let i = 0; i < userList.length; i++) {
      const userID = userList[i];

      const badges = await UserHandler.getBadges(userID);
      badgeResponse[userID] = badges;
    }

    res.send(badgeResponse);
  } catch (e) {
    Logger.logError("UserController.getUserBadges", e);
    res.send(500);
  }
}
module.exports = { getUserBadges };
