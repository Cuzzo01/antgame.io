import { ObjectId } from "mongodb";

export interface MapData {
  _id?: ObjectId;
  url: string;
  name: string;
  foodCount: number;
  thumbnailPath: string;
}
