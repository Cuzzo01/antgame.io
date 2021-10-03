const { updateConfigByID } = require("../dao/AdminDao");
const { getChallengeByChallengeId } = require("../dao/ChallengeDao");
const {
  getTournamentDetails,
  updateUserPointsTotal,
  addUserToUserPoints,
} = require("../dao/TournamentDao");
const { getLeaderboardByChallengeId } = require("../dao/UserDao");
const ChallengePlayerCountHandler = require("../handler/ChallengePlayerCountHandler");

const pointsMap = [
  { type: "rank", value: 1, points: 20 },
  { type: "rank", value: 2, points: 17.5 },
  { type: "rank", value: 3, points: 15 },
  { type: "rank", value: 4, points: 12.5 },
  { type: "rank", value: 5, points: 10 },
  { type: "rank", value: 6, points: 8 },
  { type: "rank", value: 7, points: 6 },
  { type: "rank", value: 8, points: 4 },
  { type: "rank", value: 9, points: 2 },
  { type: "rank", value: 10, points: 1 },
  { type: "percent", value: 0.1, points: 0.5 },
];

async function awardPoints(req, res) {
  try {
    const tournamentID = req.params.id;
    const challengeID = req.body.challengeID;

    const challengeConfig = await getChallengeByChallengeId(challengeID);
    const tournamentDetails = await getTournamentDetails(tournamentID);
    if (challengeConfig.active !== false) {
      send400(res, "Challenge is active");
      return;
    }
    if (challengeConfig.tournamentID.toString() !== tournamentID) {
      send400(res, "TournamentID mismatch");
      return;
    }
    if (challengeConfig.pointsAwarded === true) {
      send400(res, "Points already awarded");
      return;
    }

    const userCount = await ChallengePlayerCountHandler.getPlayerCount(challengeID);
    if (userCount === 0) {
      send400(res, "Challenge has no users");
      return;
    }

    let largestPercent = 0;
    let largestRank = 0;
    pointsMap.forEach(pointObj => {
      if (pointObj.type === "percent" && pointObj.value > largestPercent)
        largestPercent = pointObj.value;
      if (pointObj.type === "rank" && pointObj.value > largestRank) largestRank = pointObj.value;
    });
    const percentCount = Math.round(userCount * largestPercent);
    const usersToGet = percentCount > largestRank ? percentCount : largestRank;

    const leaderboardEntries = await getLeaderboardByChallengeId(challengeID, usersToGet);

    const percentCutoffs = [];
    pointsMap.forEach(pointObj => {
      if (pointObj.type === "percent") percentCutoffs.push(Math.round(pointObj.value * userCount));
    });

    let awardedPoints = [];
    for (let rank = 1; rank <= leaderboardEntries.length; rank++) {
      let entry = leaderboardEntries[rank - 1];
      if (rank <= largestRank) {
        const pointObj = pointsMap.find(obj => obj.type === "rank" && obj.value === rank);
        awardedPoints.push({ userID: entry._id, points: pointObj.points });
      }
    }

    awardedPoints.forEach(async pointUpdateObject => {
      const alreadyHasPoints =
        tournamentDetails.userPoints.find(
          obj => obj.userID.toString() === pointUpdateObject.userID.toString()
        ) !== undefined;
      let result;
      if (alreadyHasPoints)
        result = await updateUserPointsTotal(
          tournamentID,
          pointUpdateObject.userID,
          pointUpdateObject.points
        );
      else
        result = await addUserToUserPoints(
          tournamentID,
          pointUpdateObject.userID,
          pointUpdateObject.points
        );
    });

    await updateConfigByID(challengeID, { pointsAwarded: true });

    res.sendStatus(200);
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
