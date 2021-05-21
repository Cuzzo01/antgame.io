import { Config } from "../config";
import { Ant } from "./Ant";

const Brushes = Config.brushes;
const AntsToSpawn = Config.AntsToSpawn;
const AntSize = Config.AntSize;
const AntOffset = AntSize / 2;

export class AntsHandler {
  constructor(mapHandler) {
    this.mapHandler = mapHandler;
    this.ants = [];
    this.redrawAnts = false;
  }

  drawAnts(graphics, antNoFoodImage, antFoodImage) {
    graphics.clear();

    this.ants.forEach((ant) => {
      const canvasXY = this.mapHandler.mapXYToCanvasXY([ant.x, ant.y]);
      graphics.resetMatrix();

      graphics.translate(canvasXY[0], canvasXY[1]);
      graphics.rotate(ant.angle);
      graphics.translate(-AntOffset, -AntOffset);
      const antImage = ant.hasFood ? antFoodImage : antNoFoodImage;
      graphics.image(antImage, 0, 0, AntSize, AntSize);

      if (Config.debug) {
        drawDebugAnt(graphics, ant);
      }
    });

    this.redrawAnts = false;
  }

  updateAnts(dropPoint) {
    this.ants.forEach((ant) => {
      ant.getNewAngle();
    });
    this.ants.forEach((ant) => {
      ant.walk(dropPoint);
    });
    this.redrawAnts = true;
  }

  spawnAnts(homeTrailHandler, foodTrailHandler) {
    const map = this.mapHandler.map;
    this.ants = [];
    const homeCells = this.mapHandler.homeCellCount;
    let antsPerCell = AntsToSpawn / homeCells;
    if (antsPerCell > 1) antsPerCell = Math.round(antsPerCell);
    for (let x = 0; x < map.length; x++) {
      for (let y = 0; y < map[0].length; y++) {
        if (map[x][y][0] === "h") {
          if (antsPerCell < 1) {
            let rand = Math.random();
            if (rand > antsPerCell) continue;
          }
          for (let i = 0; i < antsPerCell; i++) {
            this.ants.push(
              new Ant(
                [x, y],
                this.mapHandler,
                homeTrailHandler,
                foodTrailHandler,
                Brushes.find((brush) => brush.value === map[x][y])
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

const drawDebugAnt = (graphics, ant) => {
  graphics.resetMatrix();

  const front = ant.front;
  const ahead = ant.ahead;
  const left = ant.left;
  const right = ant.right;
  graphics.fill("red");
  graphics.circle(front[0], front[1], 5);
  graphics.fill("blue");
  graphics.circle(ahead[0], ahead[1], 5);
  graphics.fill("orange");
  graphics.circle(left[0], left[1], 5);
  graphics.fill("purple");
  graphics.circle(right[0], right[1], 5);
};
