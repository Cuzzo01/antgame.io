import { Config } from "../../config";

const AntSize = Config.AntSize;
const AntOffset = AntSize / 2;

export const DrawAnts = ({ graphics, ants, mapXYToCanvasXY, antNoFoodImage, antFoodImage }) => {
  graphics.clear();

  ants.forEach(ant => {
    const canvasXY = mapXYToCanvasXY([ant.x, ant.y]);
    graphics.resetMatrix();

    graphics.translate(canvasXY[0], canvasXY[1]);
    graphics.rotate(ant.angle);
    graphics.translate(-AntOffset, -AntOffset);
    const antImage = ant.hasFood ? antFoodImage : antNoFoodImage;
    graphics.image(antImage, 0, 0, AntSize, AntSize);
  });
};
