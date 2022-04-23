const Logger = require("../Logger");
const ActiveChallengesHandler = require("../handler/ActiveChallengesHandler");
const FlagHandler = require("../handler/FlagHandler");

async function getActiveChallenges(req, res) {
  try {
    const activeChallengeData = await ActiveChallengesHandler.getActiveChallenges();
    const activeChallenges = activeChallengeData.challenges;
    const worldRecords = activeChallengeData.worldRecords;

    const records = {};
    for (const [id, wr] of Object.entries(worldRecords)) {
      records[id] = { wr: wr };
    }

    const cacheTime = await FlagHandler.getFlagValue("time-to-cache-active-challenges");
    res.set("Cache-Control", `public, max-age=${cacheTime}`);
    res.send({ challenges: activeChallenges, records: records });
  } catch (e) {
    Logger.logError("PublicController.getActiveChallenges", e);
    res.sendStatus(500);
  }
}
module.exports = { getActiveChallenges };
