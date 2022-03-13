const { Config } = require("../Config");
const { Ant } = require("./Ant");

const Brushes = Config.brushes;
const AntsToSpawn = Config.AntsToSpawn;
const HomeValue = Brushes.find(brush => brush.name === "Home").value;

class AntsHandler {
  constructor() {
    this.ants = [];
    this.redrawAnts = false;
    this.deterministicMode = false;
  }

  get antsSpawned() {
    return this.ants.length !== 0;
  }

  updateAnts() {
    this.ants.forEach(ant => {
      ant.getNewAngle();
      ant.walk();
    });
    this.redrawAnts = true;
  }

  spawnAnts({ homeTrailHandler, foodTrailHandler, mapHandler, seed }) {
    const map = mapHandler.map;
    this.ants = [];
    const homeCells = mapHandler.homeCellCount;
    let antsPerCell = AntsToSpawn / homeCells;
    if (antsPerCell > 1) antsPerCell = Math.round(antsPerCell);
    for (let x = 0; x < map.length; x++) {
      for (let y = 0; y < map[0].length; y++) {
        if (map[x][y][0] === HomeValue) {
          if (antsPerCell < 1) {
            let rand = Math.random();
            if (rand > antsPerCell) continue;
          }
          for (let i = 0; i < antsPerCell; i++) {
            this.ants.push(
              new Ant(
                [x, y],
                mapHandler,
                homeTrailHandler,
                foodTrailHandler,
                Brushes.find(brush => brush.value === map[x][y]),
                `${seed}-${i}`
              )
            );
          }
        }
      }
    }
    this.redrawAnts = true;
  }

  clearAnts() {
    this.ants = [];
    this.redrawAnts = true;
  }
}
module.exports = { AntsHandler };
