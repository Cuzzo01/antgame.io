const axios = require("axios");
const Logger = require("../Logger");

const TestApiConnection = async () => {
  const headers = GetAuthConfig();
  try {
    const result = await axios
      .get(`${GetBasePath()}/service/healthCheck`, { headers })
      .then(res => res.data);

    if (result === "OK") return true;
  } catch (e) {
    Logger.logError("AntGameApi.testApiConnection", e);
    return false;
  }
};

const GetFlag = async flagName => {
  const basePath = GetBasePath();

  return axios.get(`${basePath}/flag/${flagName}`).then(result => result.data);
};

const ClearLeaderboard = async ({ challengeID }) => {
  const basePath = GetBasePath();

  const headers = GetAuthConfig();

  return axios
    .delete(`${basePath}/service/clearLeaderboard/${challengeID}`, { headers })
    .catch(e => Logger.logError("AntGameAPI.ClearLeaderboard", e));
};

const ClearWorldRecordsCache = async () => {
  const basePath = GetBasePath();

  const headers = GetAuthConfig();

  return axios
    .delete(`${basePath}/service/clearActiveChallenges`, { headers })
    .catch(e => Logger.logError("AntGameAPI.ClearWorldRecordsCache", e));
};

const GenerateRecordImage = async ({ runID, foodEaten }) => {
  const basePath = GetBasePath();

  const headers = GetAuthConfig();

  return axios
    .post(`${basePath}/service/recordImage`, { runID, foodEaten }, { headers })
    .catch(e => Logger.logError("AntGameAPI.GenerateRecordImage", e));
};

const GetCompatibilityGoLiveDates = async () => {
  const basePath = GetBasePath();

  const headers = GetAuthConfig();

  return axios.get(`${basePath}/public/goLiveData`, { headers }).then(res => res.data);
};
module.exports = {
  GetFlag,
  ClearLeaderboard,
  ClearWorldRecordsCache,
  TestApiConnection,
  GenerateRecordImage,
  GetCompatibilityGoLiveDates
};

const GetBasePath = () => {
  if (!process.env.antapi_basePath) throw new Error("Not able to pull API base path");
  else return process.env.antapi_basePath;
};

const GetAuthConfig = () => {
  const authToken = process.env.antapi_token;
  const serviceName = process.env.antapi_name;

  if (!authToken || !serviceName) throw "Auth details not set for AntApi";

  return {
    Authorization: authToken,
    "service-id": serviceName,
    clientid: "run-verifier"
  };
};
