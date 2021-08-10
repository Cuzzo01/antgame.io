import { Config } from "../config";

export class StaticElements {
  static border(graphic, weight, color) {
    graphic.strokeWeight(weight + 1);
    graphic.noFill();
    graphic.stroke(color);

    graphic.rect(weight / 2, weight / 2, graphic.width - weight, graphic.height - weight);
  }

  static background(graphic) {
    graphic.background(Config.BackgroundColor);
  }
}
