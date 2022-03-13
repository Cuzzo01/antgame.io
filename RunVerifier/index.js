const { scheduleJob } = require("node-schedule");
const { VerificationOrchestrator } = require("./bll/VerificationOrchestrator");
const Logger = require("./Logger");

if (!process.env.environment) require("dotenv").config();

const startup = () => {
  const runVerificationCron = scheduleJob(
    { second: 0 },
    VerificationOrchestrator.getAndProcessRunsToVerify
  );
  Logger.logVerificationMessage({
    message: `cron started, runs next at: ${runVerificationCron.nextInvocation()}`,
  });
};

startup();
