import { DailyChallengeHandler } from "./DailyChallengeHandlerTS";
import { ResultCacheWrapper } from "./ResultCacheWrapperTS";
import { LeaderboardHandler } from "./LeaderboardHandlerTS";
import { ObjectIDToNameHandler } from "./ObjectIDToNameHandlerTS";

import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { RawLeaderboardEntry } from "../models/RawLeaderboardEntry";
import { LeaderboardEntry } from "../models/LeaderboardEntry";
import { SkinnyChallengeConfig } from "../models/SkinnyChallengeConfig";
import { ActiveChallengeData } from "../models/Handlers/ActiveChallengeData";
import { ChampionshipData, DailyData } from "../models/HomePageResponse";
import { RecordDetails } from "../models/RecordDetails";

const {
  getActiveChallenges,
  getRecordsByChallengeList,
  getChallengeByChallengeId,
} = require("../dao/ChallengeDao");
const FlagHandler = require("./FlagHandler");
const { getTimeStringForDailyChallenge } = require("../helpers/TimeHelper");

const DailyChallengeCache = DailyChallengeHandler.getCache();
const LeaderboardCache = LeaderboardHandler.getCache();
const ObjectIDToNameCache = ObjectIDToNameHandler.getCache();

export class ActiveChallengesHandler {
  private static cache: ActiveChallengesCache;

  static getCache(): ActiveChallengesCache {
    if (this.cache) return this.cache;
    this.cache = new ActiveChallengesCache();
    return this.cache;
  }
}

class ActiveChallengesCache extends ResultCacheWrapper<
  ActiveChallengeData | ChampionshipData | DailyData
> {
  constructor() {
    super({ name: "ActiveChallengesHandler" });
  }

  async getActiveChallenges(): Promise<ActiveChallengeData> {
    return (await this.getOrFetchValue({
      id: "activeChallenges",
      fetchMethod: async () => {
        const activeChallenges = (await getActiveChallenges()) as SkinnyChallengeConfig[];

        const challengeIDList: string[] = [];
        activeChallenges.forEach(challenge => {
          challengeIDList.push(challenge.id);
        });

        const records = (await getRecordsByChallengeList(challengeIDList)) as RecordDetails[];

        return {
          challenges: activeChallenges,
          worldRecords: records,
        };
      },
      getTimeToCache: async () =>
        parseInt(await FlagHandler.getFlagValue("time-to-cache-active-challenges")),
      logFormatter: () => "",
    })) as ActiveChallengeData;
  }

  async getChampionshipData(): Promise<ChampionshipData> {
    return (await this.getOrFetchValue({
      id: "championship",
      fetchMethod: async () => {
        const todaysChallengeID = await DailyChallengeCache.getActiveDailyChallenge();
        const todaysChallengeDetails = (await getChallengeByChallengeId(
          todaysChallengeID
        )) as FullChallengeConfig;

        let championshipID = todaysChallengeDetails.championshipID;
        let leaderboard = await LeaderboardCache.getRawChampionshipLeaderboard(championshipID);

        if (!leaderboard.length) {
          const yesterdaysChallengeID = await DailyChallengeCache.getYesterdaysDailyChallenge();
          const yesterdaysChallengeDetails = (await getChallengeByChallengeId(
            yesterdaysChallengeID
          )) as FullChallengeConfig;
          championshipID = yesterdaysChallengeDetails.championshipID;

          leaderboard = await LeaderboardCache.getRawChampionshipLeaderboard(championshipID);
        }

        const leaderboardCopy = [...leaderboard];
        if (leaderboardCopy.length > 10) leaderboardCopy.length = 10;
        await populateLeaderboardNames(leaderboardCopy);

        return {
          id: championshipID,
          leaderboard: leaderboardCopy,
          name: await ObjectIDToNameCache.getChampionshipName(championshipID),
        };
      },
      getTimeToCache: async () => await FlagHandler.getFlagValue("time-to-cache-active-challenges"),
    })) as ChampionshipData;
  }

  async getYesterdaysDailyData(): Promise<DailyData> {
    return (await this.getOrFetchValue({
      id: "yesterdays_daily",
      fetchMethod: async () => {
        const yesterdaysDailyID = await DailyChallengeCache.getYesterdaysDailyChallenge();
        const name = await ObjectIDToNameCache.getChallengeName(yesterdaysDailyID);

        const leaderboard = await LeaderboardCache.getChallengeLeaderboard(yesterdaysDailyID);
        const leaderboardCopy = [...leaderboard];
        if (leaderboardCopy.length > 10) leaderboardCopy.length = 10;

        const leaderboardData: LeaderboardEntry[] = [];
        for (let i = 0; i < leaderboardCopy.length; i++) {
          const entry = leaderboardCopy[i];
          const timeString = getTimeStringForDailyChallenge(entry.runID);

          leaderboardData.push({
            id: entry._id,
            rank: i + 1,
            username: entry.username,
            pb: entry.pb,
            age: timeString,
          });
        }

        return { name, id: yesterdaysDailyID, leaderboardData };
      },
      getTimeToCache: async () => await FlagHandler.getFlagValue("time-to-cache-active-challenges"),
    })) as DailyData;
  }

  unsetItem() {
    super.unsetAll();
  }
}

const populateLeaderboardNames = async (leaderboard: RawLeaderboardEntry[]) => {
  for (let i = 0; i < leaderboard.length; i++) {
    const entry = leaderboard[i];
    const username = await ObjectIDToNameCache.getUsername(entry._id);
    entry.username = username;
  }
};
