const PImage = require("pureimage");
const fs = require("fs");

const WallColor = "black";
const HomeColor = "#f04837";
const FoodColor = "#186A3B";
const FoodEatenColor = "#597766";
const DirtColor = "#40260F";
const HomeAmountColor = "#8e2a1f";
const FoodAmountColor = "#A8C7B5";
const BackgroundColor = "#909497";

const DrawMapImage = async ({
  mapData,
  imgWidth,
  foodAmounts,
  homeAmounts,
  attributeTag,
  challengeName,
  runNumber,
  isThumbnail,
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
      } else if (cell === "fe") {
        ctx.fillStyle = FoodEatenColor;
      } else {
        ctx.fillStyle = BackgroundColor;
      }

      const xStart = Math.floor(x * pixelDensity[0]);
      const yStart = Math.floor(y * pixelDensity[1]);
      ctx.fillRect(xStart, yStart, boxHeight, boxWidth);
    }
  }

  if (homeAmounts || foodAmounts) {
    await PImage.registerFont("assets/CourierPrime-Bold.ttf", "CourierPrime").loadPromise();
    ctx.font = "20pt CourierPrime";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }

  if (foodAmounts)
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

  if (homeAmounts)
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

  if (!isThumbnail) {
    ctx.fillText(`${challengeName} - AntGame.io`, 10, 10);
  }

  if (attributeTag) {
    ctx.textBaseline = "bottom";
    ctx.fillText(attributeTag, 10, imgHeight - 10);
  }

  if (runNumber) {
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${runNumber} runs`, imgWidth - 10, imgHeight - 10);
  }

  if (challengeName) {
    let imagePath;
    const basePath = challengeName.replaceAll(" ", "_");
    if (isThumbnail) imagePath = `${basePath}-Thumbnail.png`;
    else imagePath = `${basePath}-WR.png`;
    await PImage.encodePNGToStream(img1, fs.createWriteStream(imagePath));
    return imagePath;
  }
  throw `Falsy challenge name passed in : ${challengeName}`;
};

module.exports = { DrawMapImage };

const drawText = ({ color, text, x, y, context }) => {
  context.fillStyle = color;
  context.fillText(text, x, y);
};
