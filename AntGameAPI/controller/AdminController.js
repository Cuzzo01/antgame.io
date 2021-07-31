const { getUsersLoggedIn } = require("../dao/AdminDao");

async function getStats(req, res) {
  let response = {
    loginStats: {},
  };

  let loginStatPromises = [];
  loginStatPromises.push(getUsersLoggedIn(24));
  loginStatPromises.push(getUsersLoggedIn(72));
  loginStatPromises.push(getUsersLoggedIn(168));

  await Promise.all(loginStatPromises).then(values => {
    values.forEach(result => {
      response.loginStats[result.hours] = result.users;
    });
  });

  res.send(response);
  return;
}

module.exports = { getStats };
