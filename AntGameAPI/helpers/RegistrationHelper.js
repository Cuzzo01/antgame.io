const RegistrationDataSatisfiesCriteria = (username, password, clientID) => {
  if (username.length > 20 || username.length < 5) return false;
  if (password.length > 100 || password.length < 8) return false;
  if (!clientID) return false;
  return true;
};

module.exports = { RegistrationDataSatisfiesCriteria };
