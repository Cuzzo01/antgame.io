import { Tooltip } from "./Tooltip";

export interface MapFile {
  FoodCount: number;
  Map: string[][];
  MapName: string;
  MapVersion: number;
  ToolTips: Tooltip[];
}
