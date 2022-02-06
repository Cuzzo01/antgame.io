const PImage = require("pureimage");
const fs = require("fs");

const WallColor = "black";
const HomeColor = "#f04837";
const FoodColor = "#186A3B";
const DirtColor = "#40260F";
const HomeAmountColor = "#8e2a1f";
const FoodAmountColor = "#7DCEA0";
const BackgroundColor = "#909497";

const CreateRecordImage = async ({
  mapData,
  imgWidth,
  foodAmounts,
  homeAmounts,
  attributeTag,
  challengeName,
}) => {
  const imgHeight = Math.round(imgWidth / 1.63);
  const pixelDensity = [
    (imgWidth / mapData.length).toFixed(2),
    (imgHeight / mapData[0].length).toFixed(2),
  ];
  const boxHeight = Math.ceil(pixelDensity[0]);
  const boxWidth = Math.ceil(pixelDensity[1]);

  const img1 = PImage.make(imgWidth, imgHeight);
  const ctx = img1.getContext("2d");

  for (let x = 0; x < mapData.length; x++) {
    for (let y = 0; y < mapData[x].length; y++) {
      const cell = mapData[x][y];
      if (cell === "w") {
        ctx.fillStyle = WallColor;
      } else if (cell === "h") {
        ctx.fillStyle = HomeColor;
      } else if (cell === "f") {
        ctx.fillStyle = FoodColor;
      } else if (cell === "d") {
        ctx.fillStyle = DirtColor;
      } else {
        ctx.fillStyle = BackgroundColor;
      }

      const xStart = Math.floor(x * pixelDensity[0]);
      const yStart = Math.floor(y * pixelDensity[1]);
      ctx.fillRect(xStart, yStart, boxHeight, boxWidth);
    }
  }

  if (homeAmounts || foodAmounts || attributeTag) {
    await PImage.registerFont("assets/CourierPrime-Bold.ttf", "CourierPrime").loadPromise();
    ctx.font = "20pt CourierPrime";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }

  foodAmounts.forEach(amountData => {
    const pixelX = Math.round(amountData.x * pixelDensity[0]);
    const pixelY = Math.round(amountData.y * pixelDensity[1]);
    drawText({
      color: FoodAmountColor,
      text: amountData.value.toString(),
      x: pixelX,
      y: pixelY,
      context: ctx,
    });
  });

  homeAmounts.forEach(amountData => {
    const pixelX = Math.floor(amountData.x * pixelDensity[0]);
    const pixelY = Math.floor(amountData.y * pixelDensity[1]);
    drawText({
      color: HomeAmountColor,
      text: amountData.value.toString(),
      x: pixelX,
      y: pixelY,
      context: ctx,
    });
  });

  ctx.fillStyle = "white";
  ctx.font = "25pt CourierPrime";

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`${challengeName} - AntGame.io`, 10, 10);

  if (attributeTag) {
    ctx.textBaseline = "bottom";
    ctx.fillText(attributeTag, 10, imgHeight - 10);
  }

  if (challengeName) {
    const imagePath = `${challengeName.replaceAll(" ", "_")}-WR.png`;
    await PImage.encodePNGToStream(img1, fs.createWriteStream(imagePath));
    return imagePath;
  }
  throw `Falsy challenge name passed in : ${challengeName}`;
};

module.exports = { CreateRecordImage };

const drawText = ({ color, text, x, y, context }) => {
  context.fillStyle = color;
  context.fillText(text, x, y);
};
