const { ChampionshipOrchestrator } = require("../bll/ChampionshipOrchestrator");

async function awardPoints(req, res) {
  try {
    const championshipID = req.params.id;
    const challengeID = req.body.challengeID;

    if (!challengeID) {
      send400(res, "ChallengeID required");
    } else if (!championshipID) {
      send400(res, "ChampionshipID required");
    } else {
      try {
        await ChampionshipOrchestrator.awardPointsForChallenge({ championshipID, challengeID });
        res.sendStatus(200);
      } catch (e) {
        send400(res, e);
        return;
      }
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
}

module.exports = { awardPoints };

const send400 = (res, message) => {
  res.status(400);
  res.send(message);
};
