import { Config } from "../config";

// const AntOffset = Config.AntSize / 2;
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
// const MinSmellFloor = Config.MinSmellFloor;

export class Ant {
  constructor(pos, mapHandler, homeTrailHandler, foodTrailHandler, homeBrush) {
    this._pos = pos;
    this.mapHandler = mapHandler;
    this.homeTrailHandler = homeTrailHandler;
    this.foodTrailHandler = foodTrailHandler;
    this.homeBrush = homeBrush;
    this._angle = Math.random() * (Math.PI * 2);
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
    if (this.checkSight()) {
      if (Math.random() < 0.01) this.wander();
    } else this.wander();
    if (Math.random() < 0.01) {
      if (Math.abs(this.cumulativeAngle) > 50) {
        this.cumulativeAngle = 0;
        this.abortTrip();
      }
    }
  }

  walk(pointDrop) {
    if (pointDrop && this.dropsToSkip > 0) {
      this.dropsToSkip--;
      this.moveToNewPosition(false);
    } else {
      this.moveToNewPosition(pointDrop);
    }
  }

  // Returns true if moved for food/wall
  checkSight() {
    const points = this.getPoints();
    if (this.hasFood) return this.lookForHome(points);
    else return this.lookForFood(points);
  }

  lookForFood(points) {
    const leftScore = this.foodTrailHandler.checkLine(
      points["front"],
      points["left"]
    );
    const aheadScore = this.foodTrailHandler.checkLine(
      points["front"],
      points["ahead"]
    );
    const rightScore = this.foodTrailHandler.checkLine(
      points["front"],
      points["right"]
    );
    return this.navigate(leftScore, aheadScore, rightScore);
  }

  lookForHome(points) {
    const leftScore = this.homeTrailHandler.checkLine(
      points["front"],
      points["left"]
    );
    const aheadScore = this.homeTrailHandler.checkLine(
      points["front"],
      points["ahead"]
    );
    const rightScore = this.homeTrailHandler.checkLine(
      points["front"],
      points["right"]
    );
    return this.navigate(leftScore, aheadScore, rightScore);
  }

  navigate(leftScore, aheadScore, rightScore) {
    let action = 0;
    if (typeof leftScore === "string")
      action = this.handleObject(leftScore, "left");
    if (action === 0 && typeof rightScore === "string")
      action = this.handleObject(rightScore, "right");
    if (action === 0 && typeof aheadScore === "string")
      action = this.handleObject(aheadScore, "ahead");
    if (action !== 0) {
      if (typeof action === "string") return this.takeAction(action);
      else return action;
    }

    if (this.dropsToSkip !== 0) return false;
    if (aheadScore === 0 && leftScore === 0 && rightScore === 0) return false;
    if (aheadScore >= leftScore && aheadScore >= rightScore)
      return this.takeAction("a");
    if (rightScore === leftScore)
      Math.random() < 0.5 ? this.turnLeft() : this.turnRight();
    if (rightScore > leftScore) this.turnRight();
    if (leftScore > rightScore) this.turnLeft();
    return true;
  }

  handleObject(item, direction) {
    switch (direction) {
      case "ahead":
        return false;
      case "left":
        if (this.isObjective(item)) return "l";
        if (item === "w") return "r";
        break;
      case "right":
        if (this.isObjective(item)) return "r";
        if (item === "w") return "l";
        break;
      default:
    }
    return false;
  }

  isObjective(item) {
    if (this.hasFood) {
      return item === this.homeBrush.value;
    } else {
      return item === "f";
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
    if (Math.random() < 0.3)
      this.angle += toRad((Math.random() * 2 - 1) * StayOnCourseWanderAmount);
  }

  turnLeft() {
    this.angle -= toRad(
      ExtraSmellTurnAmount * Math.random() + MinSmellTurnAmount
    );
  }

  turnRight() {
    this.angle += toRad(
      ExtraSmellTurnAmount * Math.random() + MinSmellTurnAmount
    );
  }

  wander() {
    if (Math.random() < AntWanderChance) {
      let offset = (Math.random() - 0.5) * 2 * AntWanderAmount;
      this.angle = this._angle + toRad(offset);
    }
  }

  abortTrip() {
    this.dropsToSkip = 20;
    this._angle = Math.random() * (Math.PI * 2);
  }

  moveToNewPosition(dropPoint) {
    let dx = Math.cos(this._angle) * AntStepDistance;
    let dy = Math.sin(this._angle) * AntStepDistance;

    let newPos = [this.x + dx, this.y + dy];

    if (this.posInBounds(newPos)) {
      this.distanceTraveled += AntStepDistance;
      if (Math.random() < 0.01 && this.distanceTraveled > 5000) {
        const percentOut = (this.distanceTraveled - 5000) / 5000;
        if (Math.random() * percentOut > 1 - 0.01) {
          this.distanceTraveled -= 1000;
          this.abortTrip();
        }
      }

      this._pos = newPos;
      if (dropPoint || this.foodChanged) {
        if (this.foodChanged) this.foodChanged = false;
        this.currentCell = this.mapHandler.getCell(newPos);
        let transparency = 0;
        if (this.distanceTraveled > TrailDecayRange) transparency = 1;
        else transparency = this.distanceTraveled / TrailDecayRange;
        if (transparency < TrailTransparencyFloor) transparency = 0;
        if (this.hasFood) this.foodTrailHandler.dropPoint(newPos, transparency);
        else this.homeTrailHandler.dropPoint(newPos, transparency);
      }
    } else this.bounceOffWall();
    this._front = 0;
    this._left = 0;
    this._ahead = 0;
    this._right = 0;
  }

  bounceOffWall() {
    this.dropsToSkip = 5;
    this.reverse();
  }

  foodChange() {
    this.foodChanged = true;
    this.hasFood = !this.hasFood;
    this.dropsToSkip = 0;
    this.distanceTraveled = 0;
    this.cumulativeAngle = 0;
    this.reverse();
  }

  posInBounds(pos) {
    if (pos[0] > 0 && pos[1] > 0) {
      if (pos[0] < MapBounds[0] && pos[1] < MapBounds[1]) {
        let cell = this.mapHandler.getCell(pos);
        if (cell === false || cell === "w") return false;
        if (cell === "f") {
          if (!this.hasFood) {
            this.mapHandler.takeFood(pos);
            this.foodChange();
          } else {
            if (this.currentCell !== "f") return false;
          }
        } else if (cell === this.homeBrush.value) {
          if (this.hasFood) {
            this.mapHandler.returnFood();
            this.foodChange();
          } else {
            this.distanceTraveled = 0;
          }
        }
        return true;
      }
    }
    return false;
  }
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function toInt(smallFloat) {
  return Math.round(smallFloat);
}
