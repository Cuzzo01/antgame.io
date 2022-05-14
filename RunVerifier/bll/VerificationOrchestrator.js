const { VerifyRun } = require("../AntEngine/RunVerifier");
const {
  addTagToRun,
  unsetToVerifyFlagAndSetFinishTime,
  getRunToVerify,
  fixOrphanedRuns,
} = require("../dao/Dao");
const Logger = require("../Logger");
const { RunDisqualifier } = require("./RunDisqualifier");

class VerificationOrchestrator {
  static async getAndVerifyRun({ traceID }) {
    Logger.logVerificationMessage({ message: "Checking for run", traceID });
    const runToVerify = await getRunToVerify();

    if (runToVerify === null) {
      Logger.logVerificationMessage({ message: "No run to verify", traceID });
      return false;
    }

    Logger.logVerificationMessage({
      message: "Starting run verification",
      runID: runToVerify._id,
      traceID,
    });

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
        runID: runToVerify._id,
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
      await RunDisqualifier.handleRunDisqualification({ runID: runToVerify._id });
    }

    await unsetToVerifyFlagAndSetFinishTime({ runID: runToVerify._id });
  }

  static async findAndResetOrphanedRuns() {
    const tenMinAgo = new Date();
    tenMinAgo.setMinutes(tenMinAgo.getMinutes() - 10);

    const count = await fixOrphanedRuns({ cutoffTime: tenMinAgo });
    if (count) Logger.logVerificationMessage({ message: `reset orphaned runs`, count });
  }
}
module.exports = { VerificationOrchestrator };
