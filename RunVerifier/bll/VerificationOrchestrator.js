const { VerifyRun } = require("../AntEngine/RunVerifier");
const { getRunIDsToVerify, addTagToRun, unsetToVerifyFlag } = require("../dao/Dao");
const Logger = require("../Logger");

class VerificationOrchestrator {
  static async getAndProcessRunsToVerify() {
    Logger.logVerificationMessage({ message: "Starting to process runs" });
    const runsToVerify = await getRunIDsToVerify();

    if (runsToVerify.length > 0) {
      Logger.logVerificationMessage({ message: `Got ${runsToVerify.length} runs to verify` });

      runsToVerify.forEach(async run => {
        let result = false;
        try {
          const startTime = new Date();

          result = await VerifyRun({ run });

          const totalTime = new Date() - startTime;
          Logger.logVerificationMessage({
            message: "run verification result",
            time: totalTime,
            result,
          });
        } catch (e) {
          Logger.logError("VerifyRun", e);
        }

        if (result) {
          await addTagToRun({ id: run._id, tag: { type: "run verified" } });
        } else {
          await addTagToRun({
            id: run._id,
            tag: {
              type: "failed verification",
              metadata: { reason: "simulated score did not match" },
            },
          });
        }

        await unsetToVerifyFlag({ runID: run._id });
      });
    } else {
      Logger.logVerificationMessage({ message: "No runs to verify" });
    }

    Logger.logVerificationMessage({ message: "Done" });
  }
}
module.exports = { VerificationOrchestrator };
