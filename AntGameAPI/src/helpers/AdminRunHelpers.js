const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");

const populateUsernamesOnRuns = async ({ runs }) => {
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    if (run.userID) runs[i].username = await ObjectIDToNameHandler.getUsername(run.userID);
  }
};
module.exports = { populateUsernamesOnRuns };
