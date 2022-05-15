if (!process.env.environment) require("dotenv").config();

const { scheduleJob } = require("node-schedule");
const { VerificationOrchestrator } = require("./bll/VerificationOrchestrator");
const Logger = require("./Logger");
const { v4: uuidv4 } = require("uuid");
const { GetFlag, TestApiConnection } = require("./service/AntGameApi");

const startup = async () => {
  const CanConnectToApi = await TestApiConnection();
  if (!CanConnectToApi) throw "No API Connection";

  StartRunVerifier();
  const cleanupCron = scheduleJob(
    "*/10 * * * *",
    VerificationOrchestrator.findAndResetOrphanedRuns
  );
  Logger.logVerificationMessage({
    message: `clean up cron started`,
    nextRunTime: cleanupCron.nextInvocation(),
  });
};

const StartRunVerifier = async () => {
  const traceID = uuidv4();

  try {
    if (await GetFlag("enable-run-verifier"))
      while ((await VerificationOrchestrator.getAndVerifyRun({ traceID })) !== false) {}
    else Logger.logVerificationMessage({ message: "Skipping" });
  } catch (e) {
    Logger.logError("StartRunVerifier", e);
  }

  const nextMin = new Date();
  nextMin.setMinutes(nextMin.getMinutes() + 1);
  nextMin.setSeconds(0);

  const timeToNextCall = nextMin - new Date();
  setTimeout(StartRunVerifier, timeToNextCall);
};

startup();
