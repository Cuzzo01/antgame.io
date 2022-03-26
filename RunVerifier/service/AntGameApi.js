const axios = require("axios");

const GetFlag = async flagName => {
  let basePath;
  if (process.env.environment === "PROD") basePath = "https://antgame.io";
  else basePath = "https://dev.antgame.io";

  return axios.get(`${basePath}/api/flag/${flagName}`).then(result => result.data);
};

module.exports = { GetFlag };
