import { DailyChallengeHandler } from "./DailyChallengeHandler";
import { ResultCacheWrapper } from "./ResultCacheWrapper";
import { LeaderboardHandler } from "./LeaderboardHandler";
import { ObjectIDToNameHandler } from "./ObjectIDToNameHandler";
import { FlagHandler } from "./FlagHandler";
import {
  getActiveChallenges,
  getChallengeByChallengeId,
  getRecordsByChallengeList,
} from "../dao/ChallengeDao";

import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { RawLeaderboardEntry } from "../models/RawLeaderboardEntry";
import { LeaderboardEntry } from "../models/LeaderboardEntry";
import { SkinnyChallengeConfig } from "../models/SkinnyChallengeConfig";
import { ActiveChallengeData } from "../models/Handlers/ActiveChallengeData";
import { RecordDetails } from "../models/RecordDetails";
import { ChampionshipData, DailyData } from "../models/ActiveChallengeResponse";
import { TimeHelper } from "../helpers/TimeHelperTS";
import { LeaderboardEntryWithUsername } from "../models/LeaderboardEntryWithUsername";

const DailyChallengeCache = DailyChallengeHandler.getCache();
const LeaderboardCache = LeaderboardHandler.getCache();
const ObjectIDToNameCache = ObjectIDToNameHandler.getCache();
const FlagCache = FlagHandler.getCache();

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

  async getActiveChallenges() {
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
      getTimeToCache: async () => await FlagCache.getIntFlag("time-to-cache-active-challenges"),
      logFormatter: () => "",
    })) as ActiveChallengeData;
  }

  async getChampionshipData() {
    return (await this.getOrFetchValue({
      id: "championship",
      fetchMethod: async () => {
        const todaysChallengeID = await DailyChallengeCache.getActiveDailyChallenge();
        const todaysChallengeDetails = (await getChallengeByChallengeId(
          todaysChallengeID
        )) as FullChallengeConfig;

        let championshipID = todaysChallengeDetails.championshipID;
        let leaderboard = await LeaderboardCache.getRawChampionshipLeaderboard(
          championshipID.toString()
        );

        if (!leaderboard.length) {
          const yesterdaysChallengeID = await DailyChallengeCache.getYesterdaysDailyChallenge();
          const yesterdaysChallengeDetails = (await getChallengeByChallengeId(
            yesterdaysChallengeID
          )) as FullChallengeConfig;
          championshipID = yesterdaysChallengeDetails.championshipID;

          leaderboard = await LeaderboardCache.getRawChampionshipLeaderboard(
            championshipID.toString()
          );
        }

        const leaderboardCopy = [...leaderboard];
        if (leaderboardCopy.length > 10) leaderboardCopy.length = 10;
        const populatedLeaderboard = await populateLeaderboardNames(leaderboardCopy);

        return {
          id: championshipID.toString(),
          leaderboard: populatedLeaderboard,
          name: await ObjectIDToNameCache.getChampionshipName(championshipID),
        };
      },
      getTimeToCache: async () => await FlagCache.getIntFlag("time-to-cache-active-challenges"),
    })) as ChampionshipData;
  }

  async getYesterdaysDailyData() {
    return (await this.getOrFetchValue({
      id: "yesterdays_daily",
      fetchMethod: async () => {
        const yesterdaysDailyID = (
          await DailyChallengeCache.getYesterdaysDailyChallenge()
        ).toString();
        const name = await ObjectIDToNameCache.getChallengeName(yesterdaysDailyID);

        const leaderboard = await LeaderboardCache.getChallengeLeaderboard(yesterdaysDailyID);
        const leaderboardCopy = [...leaderboard];
        if (leaderboardCopy.length > 10) leaderboardCopy.length = 10;

        const leaderboardData: LeaderboardEntry[] = [];
        for (let i = 0; i < leaderboardCopy.length; i++) {
          const entry = leaderboardCopy[i];
          const timeString = TimeHelper.getTimeStringForDailyChallenge(entry.runID);

          const username = await ObjectIDToNameCache.getUsername(entry._id);
          leaderboardData.push({
            id: entry._id.toString(),
            rank: i + 1,
            pb: entry.pb,
            age: timeString,
            username,
          });
        }

        return { name, id: yesterdaysDailyID, leaderboardData };
      },
      getTimeToCache: async () => await FlagCache.getIntFlag("time-to-cache-active-challenges"),
    })) as DailyData;
  }

  unsetItem() {
    super.unsetAll();
  }
}

const populateLeaderboardNames = async (leaderboard: RawLeaderboardEntry[]) => {
  const toReturn: LeaderboardEntryWithUsername[] = [];
  for (let i = 0; i < leaderboard.length; i++) {
    const entry = leaderboard[i];
    const username = await ObjectIDToNameCache.getUsername(entry._id);
    toReturn.push({
      username,
      ...entry,
    });
  }
  return toReturn;
};
