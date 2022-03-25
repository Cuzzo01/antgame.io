if (!process.env.environment) require("dotenv").config();

const { scheduleJob } = require("node-schedule");
const { VerificationOrchestrator } = require("./bll/VerificationOrchestrator");
const Logger = require("./Logger");
const { v4: uuidv4 } = require("uuid");

const startup = () => {
  console.log(JSON.stringify(process.env))

  StartRunVerifier();
  const cleanupCron = scheduleJob(
    "*/10 * * * *",
    VerificationOrchestrator.findAndResetOrphanedRuns
  );
  Logger.logVerificationMessage({
    message: `cron started, runs next at: ${cleanupCron.nextInvocation()}`,
  });
};

const StartRunVerifier = async () => {
  const traceID = uuidv4();
  while ((await VerificationOrchestrator.getAndVerifyRun({ traceID })) !== false) {}

  const nextMin = new Date();
  nextMin.setMinutes(nextMin.getMinutes() + 1);
  nextMin.setSeconds(0);

  const timeToNextCall = nextMin - new Date();
  setTimeout(StartRunVerifier, timeToNextCall);
};

startup();
