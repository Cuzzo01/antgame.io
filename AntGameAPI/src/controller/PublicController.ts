import { Request, Response } from "express";
import { getUserLoginCount } from "../dao/AdminDao";
import { getDailyChallengesInReverseOrder } from "../dao/ChallengeDao";
import { ActiveChallengesHandler } from "../handler/ActiveChallengesHandlerTS";
import { DailyChallengeHandler } from "../handler/DailyChallengeHandlerTS";
import { FlagHandler } from "../handler/FlagHandler";
import { ObjectIDToNameHandler } from "../handler/ObjectIDToNameHandlerTS";
import { UserHandler } from "../handler/UserHandlerTS";
import { GenerateChallengeLeaderboardData } from "../helpers/LeaderboardHelperTS";
import { LoggerProvider } from "../LoggerTS";
import { ActiveChallengeResponse, Records, RecordsEntry } from "../models/ActiveChallengeResponse";

const Logger = LoggerProvider.getInstance();
const ActiveChallengeCache = ActiveChallengesHandler.getCache();
const DailyChallengeCache = DailyChallengeHandler.getCache();
const ObjectIDToNameCache = ObjectIDToNameHandler.getCache();
const UserCache = UserHandler.getCache();
const FlagCache = FlagHandler.getCache();
export class PublicController {
  static async getActiveChallenges(req: Request, res: Response): Promise<void> {
    try {
      const activeChallengeData = await ActiveChallengeCache.getActiveChallenges();
      const activeChallenges = activeChallengeData.challenges;
      const worldRecords = activeChallengeData.worldRecords;

      const championshipData = await ActiveChallengeCache.getChampionshipData();
      const yesterdaysDailyData = await ActiveChallengeCache.getYesterdaysDailyData();

      const records: Records = {};
      for (const [id, wr] of Object.entries(worldRecords)) {
        records[id] = <RecordsEntry>{ wr: wr };
      }

      const cacheTime = await FlagCache.getFlagValue("time-to-cache-public-endpoints");
      res.set("Cache-Control", `public, max-age=${cacheTime}`);

      const response: ActiveChallengeResponse = {
        challenges: activeChallenges,
        championshipData,
        records,
        yesterdaysDailyData,
      };

      res.send(response);
    } catch (e) {
      Logger.logError("PublicController.getActiveChallenges", e as Error);
      res.sendStatus(500);
    }
  }

  static async getChallengeLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      let challengeID = req.params.id;
      const leaderboardData = await GenerateChallengeLeaderboardData({ challengeID });

      if (!leaderboardData) {
        res.status(404);
        res.send("Found no records for that challengeID");
        return;
      }

      const currentDaily = await DailyChallengeCache.getActiveDailyChallenge();
      if (challengeID.toLowerCase() === "daily") challengeID = currentDaily.toString();

      const response = {
        name: await ObjectIDToNameCache.getChallengeName(challengeID),
        leaderboard: leaderboardData.leaderboardRows,
        daily: leaderboardData.isDaily,
        solutionImage: leaderboardData.solutionImgPath,
        playerCount: leaderboardData.playerCount,
      };

      const cacheTime = await FlagCache.getFlagValue("time-to-cache-public-endpoints");
      res.set("Cache-Control", `public, max-age=${cacheTime}`);

      res.send(response);
    } catch (e) {
      Logger.logError("PublicController.getLeaderboard", e as Error);
      res.sendStatus(500);
    }
  }

  static async getDailyChallenges(req: Request, res: Response): Promise<void> {
    try {
      const result = (await getDailyChallengesInReverseOrder({ limit: 40 })) as {
        _id: string;
        name: string;
      }[];
      const mappedResult = result.map(config => {
        return { id: config._id, name: config.name };
      });

      res.set("Cache-Control", `public, max-age=60`);
      res.send(mappedResult);
    } catch (e) {
      Logger.logError("PublicController.getDailyChallenges", e as Error);
      res.status(500);
      res.send("Get leader board failed");
    }
  }

  static async getGsgpData(req: Request, res: Response): Promise<void> {
    try {
      const activePlayers = (await getUserLoginCount(24)) as { value: number; hours: number };

      const dailyChallengeID = await DailyChallengeCache.getActiveDailyChallenge();
      const dailyLeaderboardData = await GenerateChallengeLeaderboardData({
        challengeID: dailyChallengeID.toString(),
      });
      const dailyChallengeName = await ObjectIDToNameCache.getChallengeName(dailyChallengeID.toString());
      const dailyLeaderboard = {};
      if (dailyLeaderboardData) {
        dailyLeaderboardData.leaderboardRows.forEach(entry => {
          dailyLeaderboard[entry.username] = entry.pb;
        });
      }

      const yesterdaysDailyID = await DailyChallengeCache.getYesterdaysDailyChallenge();
      const yesterdaysLeaderboardData = await GenerateChallengeLeaderboardData({
        challengeID: yesterdaysDailyID.toString(),
      });
      const yesterdaysChallengeName = await ObjectIDToNameCache.getChallengeName(yesterdaysDailyID.toString());
      const yesterdaysLeaderboard = {};
      if (yesterdaysLeaderboardData) {
        yesterdaysLeaderboardData.leaderboardRows.forEach(entry => {
          yesterdaysLeaderboard[entry.username] = entry.pb;
        });
      }

      res.set("Cache-Control", `public, max-age=600`);
      res.send({
        name: "AntGame.io",
        active_players: activePlayers.value,
        leaderboards: {
          [dailyChallengeName]: dailyLeaderboard,
          [`${yesterdaysChallengeName} (FINAL)`]: yesterdaysLeaderboard,
        },
      });
    } catch (e) {
      Logger.logError("PublicController.GetGsgpData", e as Error);
      res.status(500);
      res.send("Get leader board failed");
    }
  }

  static async getUserBadges(req: Request, res: Response): Promise<void> {
    try {
      const userID = req.params.id;

      if (!userID) {
        res.sendStatus(400);
        return;
      }

      const badges = await UserCache.getBadges(userID);
      const ttl = UserCache.getTimeToExpire(userID);

      if (ttl) {
        const maxCacheTime = await FlagCache.getIntFlag("time-to-cache-badges-external");
        const age = maxCacheTime - ttl;
        res.set(`Cache-Control`, `public, max-age=${maxCacheTime}`);
        if (age > 0) res.set(`Age`, age.toString());
      }

      if (badges) res.send(badges);
      else res.send([]);
    } catch (e) {
      Logger.logError("PublicController.getUserBadges", e as Error);
      res.send(500);
    }
  }
}
