if (!process.env.environment) require("dotenv").config();

const { default: axios } = require("axios");
const { GameRunner } = require("./AntEngine/GameRunner");
const fs = require("fs");
const { CompatibilityService } = require("./bll/CompatibilityService");

const iterationsToRun = 50;

const SimulationName = "May09WR-stock";
const mapURL = "https://antgame.io/assets/dailyMaps/May_09_2022_424328.json";
const homeLocations = [
  [20, 8],
  [49, 71],
  [58, 93],
  [62, 37],
  [111, 8],
  [161, 25],
  [169, 82],
  [172, 109],
];
const runTime = 75;

// const SimulationName = "J:30sec";
// const mapURL = "https://antgame.nyc3.cdn.digitaloceanspaces.com/maps/ChallengeJV1.0.json";
// const homeLocations = [[99, 31]];
// const runTime = 30;

// const SimulationName = "May06WR";
// const mapURL = "https://antgame.io/assets/dailyMaps/May_06_2022_706264.json";
// const homeLocations = [
//   [20, 78],
//   [44, 10],
//   [82, 30],
//   [83, 86],
//   [110, 6],
//   [134, 22],
//   [162, 100],
//   [183, 63],
// ];
// const runTime = 115;

const RunSimulations = async () => {
  const mapData = (await axios.get(mapURL)).data.Map;

  const data = {
    mapURL,
    homeLocations,
    runTime,
    scores: [],
    timing: {
      start: new Date().toISOString(),
    },
  };
  for (let i = 0; i < iterationsToRun; i++) {
    const seed = Math.round(Math.random() * 1e8);
    const mapCopy = mapData.map(line => line.slice());

    const { score } = GameRunner.SimulateRun({
      time: runTime,
      mapData: mapCopy,
      homeLocations,
      seed,
      compatibilityDate: CompatibilityService.getCompatibilityDate(new Date()),
    });

    data.scores.push({ score, seed });
    console.log(new Date().toISOString(), `${i + 1}/${iterationsToRun}`, score, seed);
  }

  data.timing.end = new Date().toISOString();

  const scores = data.scores.map(scoreData => scoreData.score);
  const avg = scores.reduce((prev, curr) => prev + curr) / scores.length;
  data.avg = avg;
  const min = Math.min(...scores);
  data.min = min;
  const max = Math.max(...scores);
  data.max = max;
  console.log({ min, avg, max });

  const fileName = `sim-${SimulationName}-${new Date().toISOString()}.json`;
  fs.writeFileSync(fileName, JSON.stringify(data));
};

RunSimulations();
