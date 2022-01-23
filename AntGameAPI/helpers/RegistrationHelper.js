const Blacklist = require("the-big-username-blacklist");
const usernameRegex = /^[a-z0-9_]+$/i;
const { CensorSensor, CensorTier } = require("censor-sensor");

const StrictCensor = new CensorSensor();
StrictCensor.disableTier(CensorTier.CommonProfanity);
StrictCensor.disableTier(CensorTier.PossiblyOffensive);
StrictCensor.disableTier(CensorTier.SexualTerms);

const LaxCensor = new CensorSensor();

const RegistrationDataSatisfiesCriteria = (username, password, clientID) => {
  if (username.length > 15 || username.length < 5) return false;
  if (password.length > 100 || password.length < 8) return false;
  if (!clientID) return false;
  return true;
};

const IsAllowedUsername = username => {
  if (!usernameRegex.test(username)) return false;
  if (StrictCensor.isProfaneIsh(username.replace("_", " "))) return false;
  if (LaxCensor.isProfane(username.replace("_", " "))) return false;
  if (!Blacklist.validate(username)) return false;
  return true;
};

module.exports = { RegistrationDataSatisfiesCriteria, IsAllowedUsername };
