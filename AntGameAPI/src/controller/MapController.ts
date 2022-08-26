import { Request, Response } from "express";
import { GenerateFoodTooltips } from "../MapGenerator/FoodTooltipGenerator";
import { MapGenerator } from "../MapGenerator/MapGenerator";

const width = 200;
const height = 112;

export class MapController {
  static getRandomMap(req: Request, res: Response) {
    try {
      const mapData = MapGenerator.generateMap(width, height);

      const toReturn = {
        MapVersion: 2,
        MapName: `GeneratedMap${Math.round(Math.random() * 10000)}`,
        Map: mapData,
        Tooltips: GenerateFoodTooltips(mapData),
      };

      res.send(toReturn);
    } catch (e) {
      console.log(e);
      res.status(500);
      res.send("Map generation failed");
    }
  }
}
