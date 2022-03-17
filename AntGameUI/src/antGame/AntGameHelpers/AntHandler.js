import { Config } from "../config";
import { Ant } from "./Ant";
import ChallengeHandler from "../Challenge/ChallengeHandler";

const Brushes = Config.brushes;
const AntsToSpawn = Config.AntsToSpawn;
const HomeValue = Brushes.find(brush => brush.name === "Home").value;

export class AntsHandler {
  constructor() {
    this.ants = [];
    this.redrawAnts = false;
    this.deterministicMode = false;
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  get antsSpawned() {
    return this.ants.length !== 0;
  }

  handleKeyDown(event) {
    if (event.key === "d" && event.ctrlKey) {
      if (!this.deterministicMode) {
        this.deterministicMode = true;
        console.log("Deterministic Mode Enabled");
      } else {
        this.deterministicMode = false;
        console.log("Deterministic Mode Disabled");
      }
    }
  }

  updateAnts() {
    this.ants.forEach(ant => {
      ant.getNewAngle();
      ant.walk();
    });
    this.redrawAnts = true;
  }

  async spawnAnts({ homeTrailHandler, foodTrailHandler, mapHandler, seed }) {
    if (this.deterministicMode) {
      seed = "1";
    }

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
    console.log("Ant count is: ", this.ants.length);
    this.redrawAnts = true;
  }

  clearAnts() {
    this.ants = [];
    this.redrawAnts = true;
  }
}
