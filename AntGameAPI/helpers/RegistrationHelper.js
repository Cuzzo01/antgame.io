const Filter = require("bad-words");
const filter = new Filter();

const Blacklist = require("the-big-username-blacklist");
const usernameRegex = /^\S*$/;

const RegistrationDataSatisfiesCriteria = (username, password, clientID, email) => {
  if (username.length > 20 || username.length < 5) return false;
  if (!usernameRegex.test(username)) return false;
  if (password.length > 100 || password.length < 8) return false;
  if (!clientID) return false;
  return true;
};

const IsAllowedUsername = username => {
  if (filter.isProfane(username)) return false;
  if (!Blacklist.validate(username)) return false;
  return true;
};

module.exports = { RegistrationDataSatisfiesCriteria, IsAllowedUsername };
