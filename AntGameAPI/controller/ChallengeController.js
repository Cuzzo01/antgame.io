const { RejectIfAnon } = require("../auth/AuthHelpers");
const ChallengeDao = require("../dao/ChallengeDao");
const UserDao = require("../dao/UserDao");
const { VerifyArtifact } = require("../helpers/ChallengeRunHelper");
const { getGeneralizedTimeStringFromObjectID } = require("../helpers/TimeHelper");
const FlagHandler = require("../handler/FlagHandler");

async function postRun(req, res) {
  try {
    const user = req.user;
    const runData = req.body.data;

    let runTags = [];

    let saveRun = false;

    const RejectUnverifiedRuns = await FlagHandler.getFlagValue("reject-anticheat-fail-runs");
    let verificationResult = await VerifyArtifact(runData, user.clientID);
    if (verificationResult !== "verified") {
      if (RejectUnverifiedRuns === false) verificationResult += " *IGNORED*";
      runTags.push({ type: "failed verification", metadata: { reason: verificationResult } });
      saveRun = "Verify Failed";
    }

    let currentDetails;
    let isPB = false;
    if (runData.PB) {
      if (verificationResult === "verified" || RejectUnverifiedRuns === false) {
        currentDetails = await UserDao.getChallengeDetailsByUser(user.id, runData.challengeID);
        if (currentDetails === null) {
          isPB = true;
          saveRun = "New challenge";
        } else if (currentDetails.pb < runData.Score) {
          isPB = true;
          saveRun = "New PB";
        }

        if (isPB)
          runTags.push({
            type: "pr",
            metadata: { runNumber: (currentDetails ? currentDetails.runs : 0) + 1 },
          });
        else
          runTags.push({
            type: "falsely claimed pb",
            metadata: { pb: currentDetails.pb, score: runData.Score },
          });
      }
    }

    if (saveRun === false) {
      // Where save limiting logic will live in the future
      // Only set to true % of time you want random run saved
      if (Math.random() > 0.1) saveRun = "No Snapshot";
      else {
        saveRun = true;
        runTags.push({ type: "random snapshot save" });
      }
    }

    let runID;
    if (saveRun) {
      let runRecord = {
        score: runData.Score,
        submissionTime: new Date(),
        name: runData.Name,
        challengeID: runData.challengeID,
        clientID: runData.ClientID,
        env: runData.Env,
        details: {
          homeLocations: runData.HomeLocations,
          timing: runData.Timing,
          foodConsumed: runData.FoodConsumed,
        },
        tags: runTags,
      };

      if (saveRun !== "No Snapshot") runRecord.details.snapshots = runData.Snapshots;

      if (user.id) {
        runRecord.userID = user.id;
      } else {
        runRecord.userID = false;
      }
      runID = await ChallengeDao.submitRun(runRecord);

      if (RejectUnverifiedRuns && verificationResult !== "verified") {
        res.sendStatus(418);
        return;
      }

      if (!user.anon) {
        if (isPB && currentDetails === null) {
          UserDao.addNewChallengeDetails(user.id, runData.challengeID, runData.Score, runID);
        } else if (isPB && currentDetails.pb) {
          UserDao.updateChallengePBAndRunCount(user.id, runData.challengeID, runData.Score, runID);
        } else {
          UserDao.incrementChallengeRunCount(user.id, runData.challengeID);
        }

        let response = {};
        if (runData.PB) {
          const newRank = await UserDao.getLeaderboardRankByScore(
            runData.challengeID,
            runData.Score
          );
          response.rank = newRank;
        }

        let isWorldRecord = false;
        let challengeRecord;
        if (user.showOnLeaderboard !== false && runData.PB) {
          challengeRecord = await ChallengeDao.getRecordByChallenge(runData.challengeID);
          const recordEmpty = challengeRecord && Object.keys(challengeRecord).length === 0;
          if (recordEmpty || challengeRecord.score < runData.Score) {
            isWorldRecord = true;
            ChallengeDao.updateChallengeRecord(
              runData.challengeID,
              runData.Score,
              user.username,
              user.id,
              runID
            );

            ChallengeDao.addTagToRun(runID, { type: "wr" });
          }
        }

        if (isWorldRecord)
          response.wr = {
            score: runData.Score,
            name: user.username,
          };
        else if (challengeRecord)
          response.wr = {
            score: challengeRecord.score,
            name: challengeRecord.username,
          };

        res.send(response);
        return;
      }
    }
    res.send("Ok");
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Save failed");
  }
}

async function getChallenge(req, res) {
  try {
    const id = req.params.id;
    const config = await ChallengeDao.getChallengeByChallengeId(id);
    if (config === false) {
      res.status(400);
      res.send("Invalid challenge ID");
      return;
    }
    res.send(config);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get challenge failed");
  }
}

async function getActiveChallenges(req, res) {
  try {
    const user = req.user;

    const activeChallenges = await ChallengeDao.getActiveChallenges();

    let challengeIDList = [];
    activeChallenges.forEach(challenge => {
      challengeIDList.push(challenge.id);
    });

    let records = await ChallengeDao.getRecordsByChallengeList(challengeIDList);
    let userRecords = false;
    if (!user.anon) {
      userRecords = await UserDao.getUserPBsByChallengeList(user.id, challengeIDList);
      if (userRecords) {
        const shouldGetRanks = await FlagHandler.getFlagValue("show-rank-on-challenge-list");

        let rankPromises = [];
        userRecords.forEach(userRecord => {
          const challengeID = userRecord.ID;
          if (records.hasOwnProperty(challengeID)) {
            records[challengeID].pb = userRecord.pb;

            if (shouldGetRanks) {
              rankPromises.push(
                UserDao.getLeaderboardRankByScore(challengeID, userRecord.pb).then(rank => {
                  return {
                    id: challengeID,
                    rank: rank,
                  };
                })
              );
            }
          }
        });

        await Promise.all(rankPromises).then(rankResults => {
          rankResults.forEach(rank => {
            records[rank.id].rank = rank.rank;
          });
        });
      }
    }

    res.send({ challenges: activeChallenges, records: records });
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get challenge failed");
  }
}

async function getRecords(req, res) {
  try {
    const challengeID = req.params.id;
    const user = req.user;

    let response = {};
    const worldRecord = await ChallengeDao.getRecordByChallenge(challengeID);
    if (Object.keys(worldRecord).length !== 0)
      response.wr = {
        score: worldRecord.score,
        name: worldRecord.username,
      };

    if (!user.anon) {
      const challengeDetails = await UserDao.getChallengeDetailsByUser(user.id, challengeID);
      if (challengeDetails !== null) {
        const rank = await UserDao.getLeaderboardRankByScore(challengeID, challengeDetails.pb);

        (response.pr = challengeDetails.pb), (response.rank = rank);
      }
    }

    res.send(response);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get run details failed");
  }
}

async function getLeaderboard(req, res) {
  try {
    const user = req.user;
    const challengeID = req.params.id;
    const leaderBoardEntries = await UserDao.getLeaderboardByChallengeId(challengeID);
    const challenge = await ChallengeDao.getChallengeByChallengeId(challengeID);

    if (leaderBoardEntries.length === 0) {
      res.status(404);
      res.send("Found no records for that challengeID");
      return;
    }

    let leaderboardData = [];
    let onLeaderboard = false;
    for (let i = 0; i < leaderBoardEntries.length; i++) {
      const entry = leaderBoardEntries[i];
      const timeString = getGeneralizedTimeStringFromObjectID(entry.runID);

      if (entry._id == user.id) {
        onLeaderboard = true;
      }

      leaderboardData.push({
        rank: i + 1,
        username: entry.username,
        pb: entry.pb,
        age: timeString,
      });
    }

    if (!onLeaderboard) {
      const pr = await UserDao.getChallengeDetailsByUser(user.id, challengeID);
      if (pr) {
        const currentUserRank = await UserDao.getLeaderboardRankByScore(challengeID, pr.pb);

        if (currentUserRank > 6) {
          const entryAbove = await UserDao.getPRByLeaderboardRank(challengeID, currentUserRank - 1);
          const timeString = getGeneralizedTimeStringFromObjectID(entryAbove.runID);
          leaderboardData.push({
            rank: currentUserRank - 1,
            username: entryAbove.username,
            pb: entryAbove.pb,
            age: timeString,
          });
        }

        const timeString = getGeneralizedTimeStringFromObjectID(pr.pbRunID);

        leaderboardData.push({
          rank: currentUserRank,
          username: user.username,
          pb: pr.pb,
          age: timeString,
        });
      }
    }

    const response = {
      name: challenge.name,
      leaderboard: leaderboardData,
    };
    res.send(response);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get leader board failed");
  }
}

async function getPRHomeLocations(req, res) {
  try {
    if (RejectIfAnon(req, res)) return;

    const user = req.user;
    const challengeID = req.params.id;

    // FIXME: Make a mongo aggregate function to do this lookup in just one call
    const runID = await UserDao.getPRRunIDByChallengeID(user.id, challengeID);
    const homePositions = await ChallengeDao.getRunHomePositionsByRunId(runID);

    if (!homePositions) {
      res.status(404);
      res.send("No PR found");
      return;
    }
    res.send({ home: homePositions });
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Get leader board failed");
  }
}

module.exports = {
  postRun,
  getChallenge,
  getActiveChallenges,
  getRecords,
  getLeaderboard,
  getPRHomeLocations,
};
