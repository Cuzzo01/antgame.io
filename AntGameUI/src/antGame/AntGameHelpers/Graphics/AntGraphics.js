import { Config } from "../../config";

const AntSize = Config.AntSize;
const AntOffset = AntSize / 2;
const AntHighlightSize = Config.AntSize * 3;
const AntHighlightOffset = AntHighlightSize / 2;

export const DrawAnts = ({ graphics, ants, mapXYToCanvasXY, antNoFoodImage, antFoodImage }) => {
  graphics.clear();

  ants.forEach(ant => {
    const highlight = ant.isLoggyBoi;
    const canvasXY = mapXYToCanvasXY([ant.x, ant.y]);
    graphics.resetMatrix();

    graphics.translate(canvasXY[0], canvasXY[1]);
    if (highlight) graphics.circle(0, 0, 40);
    graphics.rotate(ant.angle);
    if (highlight) graphics.translate(-AntHighlightOffset, -AntHighlightOffset);
    else graphics.translate(-AntOffset, -AntOffset);
    const antImage = ant.hasFood ? antFoodImage : antNoFoodImage;
    if (highlight) graphics.image(antImage, 0, 0, AntHighlightSize, AntHighlightSize);
    else graphics.image(antImage, 0, 0, AntSize, AntSize);
  });
};
