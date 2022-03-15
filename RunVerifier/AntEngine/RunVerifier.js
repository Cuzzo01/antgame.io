const { GameRunner } = require("./GameRunner");

const VerifyRun = async ({ run, mapData, time }) => {
  const simulatedScore = GameRunner.SimulateRun({
    mapData,
    homeLocations: run.details.homeLocations,
    seed: run.details.seed,
    time: time,
  });
  return simulatedScore === run.score;
};
module.exports = { VerifyRun };
