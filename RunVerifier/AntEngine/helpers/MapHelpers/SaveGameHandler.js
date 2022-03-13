const { Config } = require("../../Config");

const MapBounds = Config.MapBounds;

class SaveGameHandler {
  static LoadSaveGame(data) {
    if (!data.MapVersion) return SaveGameHandler.LoadVersion0Map(data);
    switch (data.MapVersion) {
      case 1:
        return SaveGameHandler.LoadVersion1Map(data);
      case 2:
        return SaveGameHandler.LoadVersion2Map(data);
      default:
        return false;
    }
  }

  static LoadVersion0Map(data) {
    if (!CheckMapBounds(data)) return false;
    return {
      map: data,
      name: false,
    };
  }

  static LoadVersion1Map(data) {
    const map = data.Map;
    if (!CheckMapBounds(map)) return false;
    return {
      map: map,
      name: data.MapName,
    };
  }

  static LoadVersion2Map(data) {
    const map = data.Map;
    if (!CheckMapBounds(map)) return false;
    return {
      map: map,
      name: data.MapName,
      tooltips: data.Tooltips,
    };
  }
}
module.exports = { SaveGameHandler };

const CheckMapBounds = map => {
  if (map.length !== MapBounds[0] || map[0].length !== MapBounds[1]) return false;
  return true;
};
