import { BaseLogMessage } from "./BaseLogMessage";

export interface CacheLog extends BaseLogMessage {
  cacheName: string;
  resultType: CacheResultType;
  key: string;
  time: number;
  value?: string;
}

export enum CacheResultType {
  Hit = "hit",
  Miss = "miss",
}
