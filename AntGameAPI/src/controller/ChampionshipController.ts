import { Request, Response } from "express";
import { ChampionshipOrchestrator } from "../bll/ChampionshipOrchestrator";
import { getUserPointsByUserID } from "../dao/ChampionshipDao";
import { LeaderboardHandler } from "../handler/LeaderboardHandler";
import { ObjectIDToNameHandler } from "../handler/ObjectIDToNameHandler";
import { LoggerProvider } from "../LoggerTS";

import { AuthToken } from "../auth/models/AuthToken";
import { UserPointsRow } from "../models/FullChampionshipConfig";
import { TryParseObjectID } from "../dao/helpers";

const Logger = LoggerProvider.getInstance();
const LeaderboardCache = LeaderboardHandler.getCache();
const ObjectIDToNameCache = ObjectIDToNameHandler.getCache();

export class ChampionshipController {
  static async awardPoints(req: Request, res: Response) {
    try {
      const championshipID = req.params.id;
      const request = req.body as { challengeID: string };
      const challengeID = TryParseObjectID(request.challengeID, championshipID);

      if (!challengeID) {
        send400(res, "ChallengeID required");
      } else if (!championshipID) {
        send400(res, "ChampionshipID required");
      } else {
        try {
          await ChampionshipOrchestrator.awardPointsForChallenge({ championshipID, challengeID });
          res.sendStatus(200);
        } catch (e) {
          send400(res, (e as Error).toString());
          return;
        }
      }
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  }

  static async getLeaderboard(req: Request, res: Response) {
    try {
      const user = req.user as AuthToken;
      const userID = user.id;

      const championshipID = req.params.id;
      const leaderboardData = await LeaderboardCache.getChampionshipLeaderboardData(championshipID);
      const leaderboard = [...leaderboardData.leaderboard];
      let lastPointsAwarded: false | UserPointsRow[] = false;
      if (leaderboardData.lastPointsAwarded)
        lastPointsAwarded = [...leaderboardData.lastPointsAwarded];

      const usernamePromises: Map<string, Promise<{ id: string; name: string }>> = new Map();

      let userOnLeaderboard = false;
      leaderboard.forEach(entry => {
        const id = entry._id.toString();
        if (id == userID) userOnLeaderboard = true;
        usernamePromises.set(
          id,
          ObjectIDToNameCache.getUsername(id).then(name => {
            return { id: id, name: name };
          })
        );
      });

      if (!userOnLeaderboard) {
        const result = (await getUserPointsByUserID(championshipID, userID)) as {
          userPoints: { points: number }[];
        };
        if (result !== null) {
          const userResult = result.userPoints[0];
          usernamePromises.set(userID, Promise.resolve({ id: userID, name: user.username }));
          leaderboard.push({
            points: userResult.points,
            _id: TryParseObjectID(userID, "UserID"),
            noRank: true,
          });
        }
      }

      if (lastPointsAwarded)
        lastPointsAwarded.forEach(entry => {
          const id = entry.userID.toString();
          if (!usernamePromises.has(id))
            usernamePromises.set(
              id,
              ObjectIDToNameCache.getUsername(id).then(name => {
                return { id: id, name: name };
              })
            );
        });

      const usernames = {};
      await Promise.all(usernamePromises.values()).then(results => {
        results.forEach(userData => {
          usernames[userData.id] = userData.name;
        });
      });

      const leaderboardResponse = {
        name: await ObjectIDToNameCache.getChampionshipName(championshipID),
        leaderboard: leaderboard,
        pointMap: leaderboardData.pointMap,
        lastPointsAwarded: lastPointsAwarded,
        usernames: usernames,
      };

      res.send(leaderboardResponse);
    } catch (e) {
      Logger.logError("ChampionshipController.getLeaderboard", e as Error);
      res.sendStatus(500);
    }
  }
}

const send400 = (res: Response, message: string) => {
  res.status(400);
  res.send(message);
};
