import { Config } from "../config";

export class StaticElements {
  static grid(graphic, size, spacing, color, width, height) {
    let weight = Config.borderWeight;
    let offset = Config.borderWeight;

    graphic.strokeWeight(weight);
    graphic.stroke(color);

    for (let x = 1; x < size[0]; x++) {
      graphic.line(offset + x * spacing[0], 0, offset + x * spacing[0], height);
    }

    for (let y = 1; y < size[1]; y++) {
      graphic.line(0, offset + y * spacing[1], width, offset + y * spacing[1]);
    }
  }

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
