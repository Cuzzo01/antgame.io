const { Config } = require("../Config");
const seedrandom = require("seedrandom");

const ViewDistance = Config.ViewDistance;
const ViewAngle = toRad(Config.ViewAngle);
const MinSmellTurnAmount = Config.MinSmellTurnRate;
const ExtraSmellTurnAmount = Config.MaxSmellTurnRate - MinSmellTurnAmount;
const StayOnCourseWanderAmount = Config.StayOnCourseWanderAmount;
const AntWanderAmount = Config.AntWanderAmount;
const AntWanderChance = Config.AntWanderChance;
const AntStepDistance = Config.AntStepDistance;
const TrailDecayRange = Config.TrailDecayRange;
const TrailTransparencyFloor = Config.TrailTransparencyFloor;
const MapBounds = Config.MapBounds;
const Brushes = Config.brushes;
const FoodValue = Brushes.find(brush => brush.name === "Food").value;
const DirtValue = Brushes.find(brush => brush.name === "Dirt").value;
const WallValue = Brushes.find(brush => brush.name === "Wall").value;
const TrailDropRate = Config.TrailDropRate;

class Ant {
  constructor(pos, mapHandler, homeTrailHandler, foodTrailHandler, homeBrush, id) {
    this.rng = seedrandom(id);
    this._pos = pos;
    this.mapHandler = mapHandler;
    this.homeTrailHandler = homeTrailHandler;
    this.foodTrailHandler = foodTrailHandler;
    this.homeBrush = homeBrush;
    this._angle = this.rng.quick() * (Math.PI * 2);
    this._front = 0;
    this._left = 0;
    this._ahead = 0;
    this._right = 0;
    this.hasFood = false;
    this.dropsToSkip = 0;
    this.distanceTraveled = 0;
    this.cumulativeAngle = 0;
    this.currentCell = "";
    this.foodChanged = false;
  }

  get x() {
    return this._pos[0];
  }

  get y() {
    return this._pos[1];
  }

  set angle(angle) {
    this.cumulativeAngle += this._angle - angle;
    if (angle > Math.PI * 2) this._angle = angle - Math.PI * 2;
    else if (angle < 0) this._angle = angle + Math.PI * 2;
    else this._angle = angle;
  }

  get angle() {
    return this._angle;
  }

  get front() {
    if (this._front === 0) {
      this._front = [toInt(this.x), toInt(this.y)];
    }
    return this._front;
  }

  get ahead() {
    const front = this.front;
    if (this._ahead === 0)
      this._ahead = [
        toInt(front[0] + ViewDistance * Math.cos(this._angle)),
        toInt(front[1] + ViewDistance * Math.sin(this._angle)),
      ];
    return this._ahead;
  }

  get right() {
    const front = this.front;
    if (this._right === 0)
      this._right = [
        toInt(front[0] + ViewDistance * Math.cos(this._angle + ViewAngle)),
        toInt(front[1] + ViewDistance * Math.sin(this._angle + ViewAngle)),
      ];
    return this._right;
  }

  get left() {
    const front = this.front;
    if (this._left === 0)
      this._left = [
        toInt(front[0] + ViewDistance * Math.cos(this._angle - ViewAngle)),
        toInt(front[1] + ViewDistance * Math.sin(this._angle - ViewAngle)),
      ];
    return this._left;
  }

  getNewAngle() {
    if (this.currentCell === WallValue || this.currentCell === DirtValue) return;
    if (this.checkSight()) {
      if (this.rng.quick() < 0.01) this.wander();
    } else this.wander();
    if (this.rng.quick() < 0.01) {
      if (Math.abs(this.cumulativeAngle) > 50) {
        this.cumulativeAngle = 0;
        this.abortTrip();
      }
    }
  }

  walk() {
    const dropPoint = this.rng.quick() < 1 / TrailDropRate;
    if (dropPoint) this.currentCell = this.mapHandler.getCell(this._pos);
    if (dropPoint && this.dropsToSkip > 0) {
      this.dropsToSkip--;
      this.moveToNewPosition(false);
    } else {
      this.moveToNewPosition(dropPoint);
    }
  }

  // Returns true if moved for food/wall
  checkSight() {
    const points = this.getPoints();
    if (this.hasFood) return this.lookForHome(points);
    else return this.lookForFood(points);
  }

  lookForFood(points) {
    let leftScore = this.foodTrailHandler.checkLine(points["front"], points["left"]);
    if (typeof leftScore === "number") leftScore = Math.round(leftScore);
    let aheadScore = this.foodTrailHandler.checkLine(points["front"], points["ahead"]);
    if (typeof aheadScore === "number") aheadScore = Math.round(aheadScore);
    let rightScore = this.foodTrailHandler.checkLine(points["front"], points["right"]);
    if (typeof rightScore === "number") rightScore = Math.round(rightScore);
    return this.navigate(leftScore, aheadScore, rightScore);
  }

  lookForHome(points) {
    let leftScore = this.homeTrailHandler.checkLine(points["front"], points["left"]);
    if (typeof leftScore === "number") leftScore = Math.round(leftScore);
    let aheadScore = this.homeTrailHandler.checkLine(points["front"], points["ahead"]);
    if (typeof aheadScore === "number") aheadScore = Math.round(aheadScore);
    let rightScore = this.homeTrailHandler.checkLine(points["front"], points["right"]);
    if (typeof rightScore === "number") rightScore = Math.round(rightScore);
    return this.navigate(leftScore, aheadScore, rightScore);
  }

  navigate(leftScore, aheadScore, rightScore) {
    const leftIsString = typeof leftScore === "string";
    const aheadIsString = typeof aheadScore === "string";
    const rightIsString = typeof rightScore === "string";
    if (leftIsString || aheadIsString || rightIsString) {
      const action = this.handleStringScores(leftScore, aheadScore, rightScore);
      if (action !== false) {
        this.takeAction(action);
        return true;
      }
      return false;
    }

    if (this.dropsToSkip !== 0) return false;
    if (aheadScore === 0 && leftScore === 0 && rightScore === 0) return false;

    if (aheadScore > 1550) {
      if (!this.lockedOnTrail) this.lockedOnTrail = true;
      if (this.missedCount) this.missedCount = 0;
    } else if (this.lockedOnTrail === true) {
      if (!this.missedCount) this.missedCount = 1;
      else this.missedCount++;

      let resetMissed = false;
      if (this.missedCount > 25 && this.hasFood) {
        resetMissed = true;
        this.reverse();
      } else if (this.missedCount > 15 && !this.hasFood) {
        resetMissed = true;
        this.abortTrip();
      }
      if (resetMissed) {
        this.missedCount = 0;
        this.lockedOnTrail = false;
      }
    }

    if (aheadScore >= leftScore && aheadScore >= rightScore) return this.takeAction("a");
    if (rightScore === leftScore) this.rng.quick() < 0.5 ? this.turnLeft() : this.turnRight();
    if (rightScore > leftScore) this.turnRight();
    if (leftScore > rightScore) this.turnLeft();
    return true;
  }

  handleStringScores(leftScore, aheadScore, rightScore) {
    const leftIsString = typeof leftScore === "string";
    const aheadIsString = typeof aheadScore === "string";
    const rightIsString = typeof rightScore === "string";
    if (aheadIsString && this.isObjective(aheadScore)) return "a";
    const leftFirst = this.rng.quick() <= 0.5;
    if (leftFirst && leftIsString) {
      if (this.isObjective(leftScore)) return "l";
      if (leftScore === WallValue) return "r";
      if (this.hasFood && leftScore === DirtValue) return "r";
      if (!this.hasFood && leftScore === DirtValue) return "l";
    }
    if (rightIsString) {
      if (this.isObjective(rightScore)) return "r";
      if (rightScore === WallValue) return "l";
      if (this.hasFood && rightScore === DirtValue) return "l";
      if (!this.hasFood && rightScore === DirtValue) return "r";
    }
    if (!leftFirst && leftIsString) {
      if (this.isObjective(leftScore)) return "l";
      if (leftScore === WallValue) return "r";
      if (this.hasFood && leftScore === DirtValue) return "r";
      if (!this.hasFood && leftScore === DirtValue) return "l";
    }
    return false;
  }

  isObjective(item) {
    if (this.hasFood) {
      return item === this.homeBrush.value;
    } else {
      return item === FoodValue;
    }
  }

  takeAction(action) {
    switch (action) {
      case "r":
        this.turnRight();
        return true;
      case "l":
        this.turnLeft();
        return true;
      case "a":
        this.stayOnCourse();
        return true;
      case "n":
      default:
        return false;
    }
  }

  getPoints() {
    return {
      front: this.front,
      left: this.left,
      ahead: this.ahead,
      right: this.right,
    };
  }

  reverse() {
    this.angle += Math.PI;
  }

  stayOnCourse() {
    if (this.rng.quick() < 0.3)
      this.angle += toRad((this.rng.quick() * 2 - 1) * StayOnCourseWanderAmount);
  }

  turnLeft() {
    this.angle -= toRad(ExtraSmellTurnAmount * this.rng.quick() + MinSmellTurnAmount);
  }

  turnRight() {
    this.angle += toRad(ExtraSmellTurnAmount * this.rng.quick() + MinSmellTurnAmount);
  }

  wander() {
    if (this.rng.quick() < AntWanderChance) {
      let offset = (this.rng.quick() - 0.5) * 2 * AntWanderAmount;
      this.angle = this._angle + toRad(offset);
    }
  }

  abortTrip() {
    this.dropsToSkip = 10;
    this._angle = this.rng.quick() * (Math.PI * 2);
  }

  moveToNewPosition(dropPoint) {
    let dx = Math.cos(this._angle) * AntStepDistance;
    let dy = Math.sin(this._angle) * AntStepDistance;

    let newPos = [this.x + dx, this.y + dy];

    if (this.canMoveToNewPos(newPos)) {
      this.distanceTraveled += AntStepDistance;
      if (this.rng.quick() < 0.01 && this.distanceTraveled > 500) {
        const percentOut = (this.distanceTraveled - 500) / 500;
        if (this.rng.quick() * percentOut > 1 - 0.01) {
          this.distanceTraveled -= 100;
          this.abortTrip();
        }
      }

      this._pos = newPos;
      if (dropPoint || this.foodChanged) {
        if (this.foodChanged) {
          this.currentCell = this.mapHandler.getCell(this._pos);
          this.foodChanged = false;
        }
        let transparency = 0;
        if (this.distanceTraveled > TrailDecayRange) transparency = 1;
        else transparency = this.distanceTraveled / TrailDecayRange;
        if (transparency < TrailTransparencyFloor) transparency = 0;
        if (this.hasFood) this.foodTrailHandler.dropPoint(newPos, transparency);
        else this.homeTrailHandler.dropPoint(newPos, transparency);
      }
    }
    this._front = 0;
    this._left = 0;
    this._ahead = 0;
    this._right = 0;
  }

  canMoveToNewPos(pos) {
    if (pos[0] > 0 && pos[1] > 0) {
      if (pos[0] < MapBounds[0] && pos[1] < MapBounds[1]) {
        let newCell = this.mapHandler.getCell(pos);
        const wallToDirtOrWall =
          this.currentCell === WallValue && (newCell === WallValue || newCell === FoodValue);
        // Maybe just check this conditionally on sandbox mode??
        const foodToFoodOrDirt = false;
        // this.currentCell === FoodValue &&
        // (newCell === FoodValue || newCell === DirtValue);
        const dirtToDirt = this.currentCell === DirtValue && newCell === DirtValue;
        if (wallToDirtOrWall || dirtToDirt || foodToFoodOrDirt) {
          return true;
        }

        if (newCell === false || newCell === WallValue) {
          this.bounceOffWall(5);
          return false;
        }

        if (newCell === this.homeBrush.value) {
          if (this.hasFood) {
            this.mapHandler.returnFood(pos);
            this.foodChange();
          } else {
            this.distanceTraveled = 0;
          }
        } else if (newCell === FoodValue) {
          if (!this.hasFood) {
            this.mapHandler.takeFood(pos);
            this.foodChange();
          } else {
            this.distanceTraveled = 0;
            this.bounceOffWall(0);
            return false;
          }
        } else if (newCell === DirtValue) {
          this.mapHandler.decayDirt(pos);
          if (this.rng.quick() < 0.5) this.bounceOffWall(3);
          return false;
        }
        return true;
      }
    }
    this.bounceOffWall(5);
    return false;
  }

  bounceOffWall(dropsToSkip) {
    this.dropsToSkip = dropsToSkip;
    this.angle = this.rng.quick() * (Math.PI * 2);
  }

  foodChange() {
    this.foodChanged = true;
    this.hasFood = !this.hasFood;
    this.dropsToSkip = 0;
    this.distanceTraveled = 0;
    this.cumulativeAngle = 0;
    if (this.lockedOnTrail) this.lockedOnTrail = false;
    this.reverse();
  }
}
module.exports = { Ant };

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function toInt(smallFloat) {
  return Math.round(smallFloat);
}
