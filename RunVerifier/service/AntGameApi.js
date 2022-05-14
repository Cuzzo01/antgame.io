const axios = require("axios");
const Logger = require("../Logger");

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
module.exports = { GetFlag, ClearLeaderboard, ClearWorldRecordsCache };

const GetBasePath = () => {
  if (process.env.environment === "PROD") return "https://antgame.io/api";
  else return "https://dev.antgame.io/api";
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
