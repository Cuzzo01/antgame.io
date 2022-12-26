import { ResultCacheWrapper } from "./ResultCacheWrapper";
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
import { ChallengeRecordDao } from "../dao/ChallengeRecordDao";
import { TokenRevokedHandler } from "./TokenRevokedHandler";

const FlagCache = FlagHandler.getCache();
const TokenRevokedCache = TokenRevokedHandler.getCache();

export class LeaderboardHandler {
  private static cache: LeaderboardCache;

  static getCache(): LeaderboardCache {
    if (this.cache) return this.cache;
    this.cache = new LeaderboardCache();
    return this.cache;
  }
}

class LeaderboardCache extends ResultCacheWrapper<RawLeaderboardEntry[] | ChampionshipResponse> {
  private _challengeRecordDao: ChallengeRecordDao;

  constructor() {
    super({ name: "LeaderboardHandler" });
    this._challengeRecordDao = new ChallengeRecordDao();
  }

  get size() {
    return super.getSize();
  }

  public unsetAll() {
    super.unsetAll();
  }

  unsetItem(id: string) {
    super.unsetItem(id);
    const rawID = `${id}-raw`;
    if (super.itemIsSet(rawID)) super.unsetItem(rawID);
  }

  //#region Challenge
  async getChallengeLeaderboard(id: string): Promise<RawLeaderboardEntry[]> {
    return (await this.getOrFetchValue({
      id,
      type: "Challenge",
      fetchMethod: async id => {
        const rawLeaderboard = await this.getRawChallengeLeaderboard(id);
        return rawLeaderboard.slice(0, 15);
      },
      getTimeToCache: async () => await FlagCache.getIntFlag("time-to-cache-leaderboards"),
      cacheTimeFuzzRatio: 0.2,
      logFormatter: () => "",
    })) as RawLeaderboardEntry[];
  }

  async getRawChallengeLeaderboard(id: string): Promise<RawLeaderboardEntry[]> {
    return (await this.getOrFetchValue({
      id: `${id}-raw`,
      type: "Raw challenge",
      fetchMethod: async () => {
        const rawLeaderboard = await this._challengeRecordDao.getChallengeLeaderboard(id);

        const userIds = rawLeaderboard.flatMap(entry => entry.userId.toString());
        const bannedList = await this.GetUserBannedStatus(userIds);

        const toReturn: RawLeaderboardEntry[] = [];
        for (const entry of rawLeaderboard) {
          const userBanned = bannedList[entry.userId.toString()];
          if (userBanned) continue;
          toReturn.push({
            _id: entry.userId,
            pb: entry.score,
            runID: entry.runId,
          });
        }
        return toReturn;
      },
      getTimeToCache: async () => await FlagCache.getIntFlag("time-to-cache-leaderboards"),
      cacheTimeFuzzRatio: 0.2,
      logFormatter: value => (Array.isArray(value) ? `Length: ${value.length}` : ""),
    })) as RawLeaderboardEntry[];
  }

  async getChallengeRankByUserId(challengeID: string, userID: string) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    const rank = 1 + leaderboardArr.findIndex(entry => entry._id.equals(userID));
    return rank;
  }

  async getChallengeEntryByRank(challengeID: string, rank: number) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    const entry = leaderboardArr[rank - 1];
    return entry;
  }

  async getChallengeEntryByUserID(challengeID: string, userID: string) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    const entry = leaderboardArr.find(entry => entry._id.equals(userID));
    return entry;
  }

  async getChallengePlayerCount(challengeID: string) {
    const leaderboardArr = await this.getRawChallengeLeaderboard(challengeID);
    return leaderboardArr.length;
  }
  //#endregion

  //#region Championship
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
      getTimeToCache: async () => await FlagCache.getIntFlag("time-to-cache-leaderboards"),
      cacheTimeFuzzRatio: 0.2,
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
      getTimeToCache: async () => await FlagCache.getIntFlag("time-to-cache-leaderboards"),
      cacheTimeFuzzRatio: 0.2,
      logFormatter: value => (Array.isArray(value) ? `Length: ${value.length}` : ""),
    })) as RawLeaderboardEntry[];
  }

  async getChampionshipEntryByUserId(championshipId: string, userId: string) {
    const leaderboardArr = await this.getRawChampionshipLeaderboard(championshipId);
    const index = leaderboardArr.findIndex(entry => entry._id.equals(userId));
    if (index === -1) return { found: false };
    return { found: true, entry: leaderboardArr[index], rank: index + 1 };
  }
  //#endregion

  private async GetUserBannedStatus(userIds: string[]): Promise<{ [userId: string]: boolean }> {
    const promiseList = userIds.flatMap(async id => {
      const banned = await TokenRevokedCache.isUserBanned(id);
      return { id, banned };
    });

    const results = await Promise.all(promiseList);
    const toReturn = {};

    for (const result of results) {
      toReturn[result.id] = result.banned;
    }
    return toReturn;
  }
}
