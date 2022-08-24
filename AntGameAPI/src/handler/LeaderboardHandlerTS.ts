import { ResultCacheWrapper } from "./ResultCacheWrapperTS";
import { getLeaderboardByChallengeId } from "../dao/UserDao";
import {
  getChampionshipDetailsFromDB,
  getLastPointsAwarded,
  getLeaderboardByChampionshipID,
} from "../dao/ChampionshipDao";
import { getChallengeByChallengeId } from "../dao/ChallengeDao";
import { FlagHandler } from "./FlagHandler";

import { ChampionshipResponse } from "../models/ChampionshipResponse";
import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { FullChampionshipConfig } from "../models/FullChampionshipConfig";
import { RawLeaderboardEntry } from "../models/RawLeaderboardEntry";

const FlagCache = FlagHandler.getCache();

export class LeaderboardHandler {
  private static cache: LeaderboardCache;

  static getCache(): LeaderboardCache {
    if (this.cache) return this.cache;
    this.cache = new LeaderboardCache();
    return this.cache;
  }
}

class LeaderboardCache extends ResultCacheWrapper<RawLeaderboardEntry[] | ChampionshipResponse> {
  constructor() {
    super({ name: "LeaderboardHandler" });
  }

  public unsetAll() {
    super.unsetAll();
  }

  getTimeToCache: () => Promise<number> = async () => {
    const maxTime = await FlagCache.getIntFlag("time-to-cache-leaderboards");
    return Math.round(maxTime * (1 - Math.random() * 0.2));
  };

  unsetItem(id: string) {
    super.unsetItem(id);
    const rawID = `${id}-raw`;
    if (super.itemIsSet(rawID)) super.unsetItem(rawID);
  }

  async getChallengeLeaderboard(id: string): Promise<RawLeaderboardEntry[]> {
    return (await this.getOrFetchValue({
      id,
      type: "Challenge",
      fetchMethod: async id => {
        return (await getLeaderboardByChallengeId(id, 15)) as RawLeaderboardEntry[];
      },
      getTimeToCache: this.getTimeToCache,
      logFormatter: () => "",
    })) as RawLeaderboardEntry[];
  }

  async getChampionshipLeaderboardData(id: string): Promise<ChampionshipResponse> {
    return (await this.getOrFetchValue({
      id,
      type: "Championship",
      fetchMethod: async id => {
        const leaderboard = getLeaderboardByChampionshipID(id, 50) as Promise<
          RawLeaderboardEntry[]
        >;
        const data = getChampionshipDetailsFromDB(id) as Promise<FullChampionshipConfig>;
        const toReturn: ChampionshipResponse = {
          leaderboard: await leaderboard,
          pointMap: (await data).pointsMap,
        };

        const lastPointsAwardedID = (await getLastPointsAwarded(id)) as string;
        if (lastPointsAwardedID) {
          const lastPointsAwardedChallenge = (await getChallengeByChallengeId(
            lastPointsAwardedID.toString()
          )) as FullChallengeConfig;
          toReturn.lastPointsAwarded = lastPointsAwardedChallenge.pointsAwarded;
        }

        return toReturn;
      },
      getTimeToCache: this.getTimeToCache,
      logFormatter: () => "",
    })) as ChampionshipResponse;
  }

  async getRawChampionshipLeaderboard(id: string): Promise<RawLeaderboardEntry[]> {
    return (await this.getOrFetchValue({
      id: `${id}-raw`,
      type: "Raw championship",
      fetchMethod: async () => {
        return (await getLeaderboardByChampionshipID(id)) as RawLeaderboardEntry[];
      },
      getTimeToCache: this.getTimeToCache,
      logFormatter: value => (Array.isArray(value) ? `Length: ${value.length}` : ""),
    })) as RawLeaderboardEntry[];
  }

  async getRawChallengeLeaderboard(id: string): Promise<RawLeaderboardEntry[]> {
    return (await this.getOrFetchValue({
      id: `${id}-raw`,
      type: "Raw challenge",
      fetchMethod: async () => {
        return (await getLeaderboardByChallengeId(id)) as RawLeaderboardEntry[];
      },
      getTimeToCache: this.getTimeToCache,
      logFormatter: value => (Array.isArray(value) ? `Length: ${value.length}` : ""),
    })) as RawLeaderboardEntry[];
  }

  async getChallengeRankByUserId(challengeID: string, userID: string) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    const rank = 1 + leaderboardArr.findIndex(entry => entry._id.equals(userID));
    return rank;
  }

  async getLeaderboardEntryByRank(challengeID: string, rank: number) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    const entry = leaderboardArr[rank - 1];
    return entry;
  }

  async getLeaderboardEntryByUserID(challengeID: string, userID: string) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    const entry = leaderboardArr.find(entry => entry._id.equals(userID));
    return entry;
  }

  async getChallengePlayerCount(challengeID: string) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    return leaderboardArr.length;
  }
}
