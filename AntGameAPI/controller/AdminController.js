const { getUsersLoggedIn, getConfigListFromDB, getConfigDetailsByID } = require("../dao/AdminDao");

async function getStats(req, res) {
  let response = {
    uniqueUserStats: {},
  };

  let loginStatPromises = [];
  loginStatPromises.push(getUsersLoggedIn(24));
  loginStatPromises.push(getUsersLoggedIn(72));
  loginStatPromises.push(getUsersLoggedIn(168));

  await Promise.all(loginStatPromises).then(values => {
    values.forEach(result => {
      response.uniqueUserStats[result.hours] = result.users;
    });
  });

  res.send(response);
  return;
}

async function getConfigList(req, res) {
  try {
    res.send(await getConfigListFromDB());
    return;
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
}

async function getConfigDetails(req, res) {
  try {
    const id = req.params.id;
    let result = await getConfigDetailsByID(id);

    let modifiedRecords = result.records;
    for (let i = 0; i < modifiedRecords.length; i++) {
      const record = modifiedRecords[i];
      const timestamp = record.runID.getTimestamp();
      modifiedRecords[i].time = timestamp;
    }
    result.records = modifiedRecords;
    res.send(result);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
}

module.exports = { getStats, getConfigList, getConfigDetails };
