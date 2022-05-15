const axios = require("axios");
const Logger = require("../Logger");

const TestApiConnection = async () => {
  const headers = GetAuthConfig();
  try {
    const path = `${GetBasePath()}/service/healthCheck`
    console.log(path)
    const result = await axios
      .get(`${GetBasePath()}/service/healthCheck`, { headers })
      .then(res => res.data);

    if (result === "OK") return true;
  } catch (e) {
    console.log(e)
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
    .catch(e => Logger.logError("AntGameAPI", e));
};

const ClearWorldRecordsCache = async () => {
  const basePath = GetBasePath();

  const headers = GetAuthConfig();

  return axios
    .delete(`${basePath}/service/clearActiveChallenges`, { headers })
    .catch(e => Logger.logError("AntGameAPI", e));
};
module.exports = { GetFlag, ClearLeaderboard, ClearWorldRecordsCache, TestApiConnection };

const GetBasePath = () => {
  if (process.env.environment === "PROD") return "https://antgame.io/api";
  if (process.env.environment === "DEV") return "https://antgame.io/api";
  else return "http://localhost:8080";
};

const GetAuthConfig = () => {
  const authToken = process.env.antapi_token;
  const serviceName = process.env.antapi_name;

  if (!authToken || !serviceName) throw "Auth details not set for AntApi";

  return {
    Authorization: authToken,
    "service-id": serviceName,
  };
};
