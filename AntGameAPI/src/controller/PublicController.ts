import { Request, Response } from "express";
import { getUserLoginCount } from "../dao/AdminDao";
import { getDailyChallengesInReverseOrder } from "../dao/ChallengeDao";
import { ActiveChallengesHandler } from "../handler/ActiveChallengesHandler";
import { CompatibilityGoLiveHandler } from "../handler/CompatibilityGoLiveHandler";
import { DailyChallengeHandler } from "../handler/DailyChallengeHandler";
import { FlagHandler } from "../handler/FlagHandler";
import { ObjectIDToNameHandler } from "../handler/ObjectIDToNameHandler";
import { UserHandler } from "../handler/UserHandler";
import { GenerateChallengeLeaderboardData } from "../helpers/LeaderboardHelper";
import { LoggerProvider } from "../LoggerTS";
import { ActiveChallengeResponse, Records, RecordsEntry } from "../models/ActiveChallengeResponse";
import { BadgeRequest } from "../models/BadgeRequest";
import { BadgeResponse } from "../models/BadgeResponse";

const Logger = LoggerProvider.getInstance();
const ActiveChallengeCache = ActiveChallengesHandler.getCache();
const DailyChallengeCache = DailyChallengeHandler.getCache();
const ObjectIDToNameCache = ObjectIDToNameHandler.getCache();
const UserCache = UserHandler.getCache();
const FlagCache = FlagHandler.getCache();
const CompatibilityGoLiveCache = CompatibilityGoLiveHandler.getCache();

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
      let page: number;
      try {
        page = parseInt(req.params.page);
      } catch (_) {
        res.sendStatus(400);
        return;
      }

      const leaderboardData = await GenerateChallengeLeaderboardData(challengeID, page);

      if (!leaderboardData) {
        res.status(204);
        res.send("Found no records for that challengeID");
        return;
      }

      const currentDaily = await DailyChallengeCache.getActiveDailyChallenge();
      if (challengeID.toLowerCase() === "daily") challengeID = currentDaily.toString();

      const response = {
        name: await ObjectIDToNameCache.getChallengeName(challengeID),
        leaderboard: leaderboardData.leaderboardRows,
        daily: leaderboardData.isDaily,
        active: challengeID === currentDaily.toString(),
        solutionImage: leaderboardData.solutionImgPath,
        playerCount: leaderboardData.playerCount,
        pageLength: await FlagCache.getIntFlag("leaderboard-length"),
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
      const dailyLeaderboardData = await GenerateChallengeLeaderboardData(
        dailyChallengeID.toString()
      );
      const dailyChallengeName = await ObjectIDToNameCache.getChallengeName(
        dailyChallengeID.toString()
      );
      const dailyLeaderboard = {};
      if (dailyLeaderboardData) {
        dailyLeaderboardData.leaderboardRows.forEach(entry => {
          dailyLeaderboard[entry.username] = entry.pb;
        });
      }

      const yesterdaysDailyID = await DailyChallengeCache.getYesterdaysDailyChallenge();
      const yesterdaysLeaderboardData = await GenerateChallengeLeaderboardData(
        yesterdaysDailyID.toString()
      );
      const yesterdaysChallengeName = await ObjectIDToNameCache.getChallengeName(
        yesterdaysDailyID.toString()
      );
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
      const request = req.body as BadgeRequest;
      const userList = request.userList;

      if (!userList || userList.length > 100) {
        res.sendStatus(400);
        return;
      }

      const badgeResponse: BadgeResponse = {};
      for (let i = 0; i < userList.length; i++) {
        const userID = userList[i];

        const badges = await UserCache.getBadges(userID);
        badgeResponse[userID] = badges;
      }

      res.send(badgeResponse);
    } catch (e) {
      Logger.logError("PublicController.getUserBadges", e as Error);
      res.send(500);
    }
  }

  static async getUserInfo(req: Request, res: Response) {
    try {
      const username = req.params.username;

      const userDetails = await UserCache.getInfo(username.toLowerCase());
      const ttl = UserCache.getTimeToExpire(username);

      if (ttl) {
        const maxCacheTime = await FlagCache.getIntFlag("time-to-cache-badges-external");
        const age = maxCacheTime - ttl;
        res.set(`Cache-Control`, `public, max-age=${maxCacheTime}`);
        if (age > 0) res.set(`Age`, age.toString());
      }

      userDetails.username = await ObjectIDToNameCache.getUsername(userDetails.id);

      res.send(userDetails);
    } catch (e) {
      Logger.logError("UserController.getUserInfo", e as Error);
      res.send(500);
    }
  }

  static async getCompatibilityGoLiveDates(req: Request, res: Response) {
    try {
      const goLiveDates = await CompatibilityGoLiveCache.getGoLiveDates();
      const ttl = CompatibilityGoLiveCache.getTimeToExpire();

      const maxAge = await FlagCache.getIntFlag("cache-time.go-live-dates-sec");
      const age = maxAge - ttl;
      res.set("Cache-Control", `public, max-age=${maxAge}`);
      res.set("Age", age.toString());

      res.send(goLiveDates);
    } catch (e) {
      Logger.logError("UserController.getGoLiveDates", e as Error);
      res.send(500);
    }
  }
}
