import { AuthToken } from "../auth/models/AuthToken";
import { getRunDataByRunId } from "../dao/ChallengeDao";
import { FlagHandler } from "../handler/FlagHandler";
import { LeaderboardHandler } from "../handler/LeaderboardHandler";
import { MapHandler } from "../handler/MapHandler";
import { FullChallengeConfig } from "../models/FullChallengeConfig";

const FlagCache = FlagHandler.getCache();
const MapCache = MapHandler.getCache();
const LeaderboardCache = LeaderboardHandler.getCache();

export class ReplayConfigHelper {
  static async getMapPath(config: FullChallengeConfig) {
    if (config.mapID) {
      const mapData = await MapCache.getMapData({ mapID: config.mapID.toString() });
      if (await FlagCache.getFlagValue("use-spaces-proxy")) {
        return `https://antgame.io/assets/${mapData.url}`;
      } else {
        return `https://antgame.nyc3.digitaloceanspaces.com/${mapData.url}`;
      }
    } else {
      return config.mapPath;
    }
  }

  static async getPrData(id: string, user: AuthToken) {
    const prRunInfo = await LeaderboardCache.getChallengeEntryByUserID(id, user.id);
    if (prRunInfo) {
      const prRunData = (await getRunDataByRunId(prRunInfo.runID)) as {
        homeLocations: number[][];
        homeAmounts: { [location: string]: number };
        seed: number;
        score: number;
      };
      return {
        locations: prRunData.homeLocations,
        amounts: prRunData.homeAmounts,
        seed: prRunData.seed,
        score: prRunData.score,
      };
    }
  }

  static async getWrData(id: string) {
    const wrRunInfo = await LeaderboardCache.getChallengeEntryByRank(id, 1);
    if (wrRunInfo) {
      const wrRunData = (await getRunDataByRunId(wrRunInfo.runID)) as {
        homeLocations: number[][];
        homeAmounts: { [location: string]: number };
        seed: number;
        score: number;
      };
      return {
        locations: wrRunData.homeLocations,
        amounts: wrRunData.homeAmounts,
        seed: wrRunData.seed,
        score: wrRunData.score,
      };
    }
  }
}
