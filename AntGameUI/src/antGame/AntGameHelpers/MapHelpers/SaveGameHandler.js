import { Config } from "../../config";
import { GenerateFoodTooltips } from "./FoodTooltipGenerator";
import { CleanFoodAndDirt } from "./MapCleaner";

const MapBounds = Config.MapBounds;

export class SaveGameHandler {
  static GenerateSaveGame(map, mapName) {
    CleanFoodAndDirt(map);
    return {
      MapVersion: 2,
      MapName: mapName,
      Map: map,
      Tooltips: GenerateFoodTooltips(map),
    };
  }

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

  static Download(jsonData, fileName) {
    var textDoc = document.createElement("a");

    textDoc.href = "data:attachment/text," + encodeURI(JSON.stringify(jsonData));
    textDoc.target = "_blank";

    textDoc.download = fileName;
    textDoc.click();
  }

  static GenerateSaveGameName(fileName) {
    const date = new Date();
    // const dateString = `${date
    //   .toDateString()
    //   .split(" ")
    //   .join("_")}_${date.getHours()}_${date.getMinutes()}`;
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 10) month = "0" + month;
    if (day < 10) day = "0" + day;
    const dateString = `${date.getFullYear()}${month}${day}`;
    return `${fileName}_${dateString}.json`;
  }
}

const CheckMapBounds = map => {
  if (map.length !== MapBounds[0] || map[0].length !== MapBounds[1]) return false;
  return true;
};
