const { getRunIDsToVerify, addTagToRun, unsetToVerifyFlag } = require("../dao/Dao");
const Logger = require("../Logger");
const { SpawnVerificationRun } = require("./VerificationProcess");

class VerificationOrchestrator {
  static async getAndProcessRunsToVerify() {
    try {
      Logger.logVerificationMessage({ message: "Starting to process runs" });
      const runsToVerify = await getRunIDsToVerify();

      if (runsToVerify.length > 0) {
        Logger.logVerificationMessage({ message: `Got ${runsToVerify.length} runs to verify` });

        const promises = new Map();
        for (const run of runsToVerify) {
          promises.set(run._id, SpawnVerificationRun({ runData: run }));
        }

        for (const [id, resultPromise] of promises) {
          let result = false;
          try {
            result = await resultPromise;

            if (result) {
              await addTagToRun({ id, tag: { type: "run verified" } });
            } else {
              await addTagToRun({
                id,
                tag: {
                  type: "failed verification",
                  metadata: { reason: "simulated score did not match" },
                },
              });
            }
          } catch (e) {
            Logger.logError("VerifyRun", e);
          }
          await unsetToVerifyFlag({ runID: id });
        }
      } else {
        Logger.logVerificationMessage({ message: "No runs to verify" });
      }

      Logger.logVerificationMessage({ message: "Done" });
    } catch (e) {
      Logger.logError("VerificationOrchestrator", e);
    }
  }
}
module.exports = { VerificationOrchestrator };
