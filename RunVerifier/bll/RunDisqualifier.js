const { getRunDetailsByID } = require("../dao/Dao");
const { getNewUserPB } = require("../dao/RunDao");
const { getChallengeDetailsByUser, updateChallengePB } = require("../dao/UserDao");
const Logger = require("../Logger")

class RunDisqualifier {
    static async handleRunDisqualification({ runID, traceID }) {
        // get run
        Logger.logVerificationMessage({ traceID, runID, message: "Starting run disqualification" })
        const runDetails = await getRunDetailsByID({ runID });
        const userID = runDetails.userID
        const challengeID = runDetails.challengeID

        // mark run disqualified

        // check if run is current WR

        // check if run is current PR (chances are yes)
        Logger.logVerificationMessage({ traceID, runID, message: "Checking if run is still PB" })
        const userChallengeDetails = await getChallengeDetailsByUser({ userID, challengeID });
        if (runID !== userChallengeDetails.pbRunID) return

        // get users new PR run (best scoring run not counting this one)
        Logger.logVerificationMessage({traceID, runID, message: "Finding new PB run"})
        const newPBRunDetails = await getNewUserPB({ userID, challengeID, oldPBRunID: runID })
        const newRunID = newPBRunDetails._id;
        const newScore = newPBRunDetails.score;

        // set run as PR 
        Logger.logVerificationMessage({traceID, runID, message: "Updating user record"})
        await updateChallengePB({ userID, challengeID, runID: newRunID, score: newScore })

        // call API to dump leaderboard
        Logger.logVerificationMessage({traceID, runID, message: "Updating user record"})
    }
}
module.exports = { RunDisqualifier }