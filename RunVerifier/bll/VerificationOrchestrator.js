const { VerifyRun } = require("../AntEngine/RunVerifier");
const { addTagToRun, unsetToVerifyFlagAndSetFinishTime, getRunToVerify } = require("../dao/Dao");
const Logger = require("../Logger");

class VerificationOrchestrator {
  static async getAndVerifyRun({ traceID }) {
    Logger.logVerificationMessage({ message: "Checking for run", traceID });
    const runToVerify = await getRunToVerify();

    if (runToVerify === null) {
      Logger.logVerificationMessage({ message: "No run to verify", traceID });
      return false;
    }

    Logger.logVerificationMessage({ message: "Starting run verification", runID: runToVerify._id, traceID });

    let result = false;
    try {
      const startTime = new Date();
      result = await VerifyRun({ run: runToVerify });
      const totalTime = new Date() - startTime;
      Logger.logVerificationMessage({
        message: "run verification result",
        time: totalTime,
        result,
        traceID,
      });
    } catch (e) {
      Logger.logError("VerifyRun", e);
    }

    if (result) {
      await addTagToRun({ id: runToVerify._id, tag: { type: "run verified" } });
    } else {
      await addTagToRun({
        id: runToVerify._id,
        tag: {
          type: "failed verification",
          metadata: { reason: "simulated score did not match" },
        },
      });
    }

    await unsetToVerifyFlagAndSetFinishTime({ runID: runToVerify._id });
  }
}
module.exports = { VerificationOrchestrator };
