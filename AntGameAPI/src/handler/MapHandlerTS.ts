import { MapData } from "../models/Maps/MapData";
import { ResultCacheWrapper } from "./ResultCacheWrapperTS";

const { getMapByID } = require("../dao/MapDao");

export class MapHandler {
  private static cache: MapCache;

  static getCache(): MapCache {
    if (this.cache) return this.cache;
    this.cache = new MapCache();
    return this.cache;
  }
}

class MapCache extends ResultCacheWrapper<MapData> {
  constructor() {
    super({ name: "MapHandler" });
  }

  async getMapData(p: { mapID: string }) {
    return await this.getOrFetchValue({
      id: p.mapID,
      getTimeToCache: () => 3600,
      fetchMethod: async () => {
        const mapData = (await getMapByID({ mapID: p.mapID })) as MapData;
        return {
          url: mapData.url,
          name: mapData.name,
          foodCount: mapData.foodCount,
          thumbnailPath: mapData.thumbnailPath,
        };
      },
    });
  }
}
