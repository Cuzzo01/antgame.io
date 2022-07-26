const { getMapByID } = require("../dao/MapDao");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");

class MapHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "MapHandler" });
  }

  async getMapData({ mapID }) {
    return await this.getOrFetchValue({
      id: mapID,
      getTimeToCache: () => 3600,
      fetchMethod: async () => {
        const mapData = await getMapByID({ mapID });
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
const SingletonInstance = new MapHandler();
module.exports = SingletonInstance;
