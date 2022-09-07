const { getRecordByChallenge, removeWorldRecord } = require("../dao/ChallengeDao");
const { ChallengeRecordDao } = require("../dao/ChallengeRecordDao");
const { getNewUserPB, getRunDetailsByID } = require("../dao/RunDao");
const Logger = require("../Logger");
const { ClearLeaderboard, ClearWorldRecordsCache } = require("../service/AntGameApi");

const _challengeRecordDao = new ChallengeRecordDao();

class RunDisqualifier {
  static async handleRunDisqualification({ runID, traceID }) {
    Logger.logVerificationMessage({ traceID, runID, message: "Starting run disqualification" });

    const runDetails = await getRunDetailsByID({ runID });
    const userID = runDetails.userID;
    const challengeID = runDetails.challengeID;

    if (runDetails.tags.findIndex(tag => tag.type === "wr") !== -1) {
      const record = await getRecordByChallenge({ challengeID });
      if (record.runId.equals(runID)) {
        Logger.logVerificationMessage({ traceID, runID, message: "Run is current WR" });
        await removeWorldRecord({ challengeID, runID });

        await ClearWorldRecordsCache();
      }
    }

    Logger.logVerificationMessage({ traceID, runID, message: "Checking if run is still PB" });
    const userChallengeDetails = await _challengeRecordDao.getRecord(challengeID, userID);
    if (userChallengeDetails === null || !userChallengeDetails.runId.equals(runID)) {
      Logger.logVerificationMessage({ traceID, runID, message: "Run is no longer PR, done" });
      return;
    }

    Logger.logVerificationMessage({ traceID, runID, message: "Finding new PB run" });
    const newPBRunDetails = await getNewUserPB({ userID, challengeID, oldPBRunID: runID });
    if (newPBRunDetails === null) {
      Logger.logVerificationMessage({ traceID, runID, message: "User has no other verified runs" });

      _challengeRecordDao.deleteRecord(challengeID, userID);
    } else {
      const newRunID = newPBRunDetails._id;
      const newScore = newPBRunDetails.score;

      Logger.logVerificationMessage({ traceID, runID, message: "Updating user record" });
      await _challengeRecordDao.updateRecord(challengeID, userID, newScore, newRunID);
    }

    Logger.logVerificationMessage({ traceID, runID, message: "Dumping leaderboard cache" });
    await ClearLeaderboard({ challengeID });

    Logger.logVerificationMessage({ traceID, runID, message: "Done handling run rejection" });
  }
}
module.exports = { RunDisqualifier };
