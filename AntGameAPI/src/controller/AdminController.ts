/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request, Response } from "express";
import { handleDailyChallengeChange } from "../bll/DailyChallengeCron";
import {
  addNewConfig,
  getChampionshipListFromDB,
  getConfigDetailsByID,
  getConfigListFromDB,
  getFlagDetailsByID,
  getFlagListFromDB,
  getNewAccountCount,
  getRecentlyCreatedUsers,
  getRecentlyLoggedInUsers,
  getRecentRuns,
  getRunCount,
  getRunDetailsByID,
  getRunsByTag,
  getUserDetailsByID,
  getUserLoginCount,
  saveNewServiceToken,
  updateConfigByID,
  updateFlagByID,
  updateUserByID,
} from "../dao/AdminDao";
import { getActiveChallenges, markRunForVerification } from "../dao/ChallengeDao";
import { getChampionshipDetailsFromDB } from "../dao/ChampionshipDao";
import { FlagHandler } from "../handler/FlagHandler";
import { LeaderboardHandler } from "../handler/LeaderboardHandler";
import { ObjectIDToNameHandler } from "../handler/ObjectIDToNameHandler";
import { UserHandler } from "../handler/UserHandler";
import { populateUsernamesOnRuns } from "../helpers/AdminRunHelpers";
import { addStatToResponse } from "../helpers/AuthStatHelpers";
import { LoggerProvider } from "../LoggerTS";
import crypto from "crypto";
import { TokenRevokedHandler } from "../handler/TokenRevokedHandler";
import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { AuthToken } from "../auth/models/AuthToken";
import { PasswordHandler } from "../auth/PasswordHandler";
import { RunData } from "../models/Admin/RunData";
import { getOutstandingSeedCount } from "../dao/SeedDao";

const Logger = LoggerProvider.getInstance();
const LeaderboardCache = LeaderboardHandler.getCache();
const ObjectIDToNameCache = ObjectIDToNameHandler.getCache();
const UserCache = UserHandler.getCache();
const FlagCache = FlagHandler.getCache();
const TokenRevokedCache = TokenRevokedHandler.getCache();

export class AdminController {
  //#region stats
  static async getStats(req: Request, res: Response) {
    const response = {
      uniqueUserStats: {},
      newAccountStats: {},
      runCountStats: {},
      serviceCounts: {},
    };

    const loginStatPromises = [];
    loginStatPromises.push(getUserLoginCount(24));
    loginStatPromises.push(getUserLoginCount(168));
    loginStatPromises.push(getUserLoginCount(720));

    const newAccountStatPromises = [];
    newAccountStatPromises.push(getNewAccountCount(24));
    newAccountStatPromises.push(getNewAccountCount(168));
    newAccountStatPromises.push(getNewAccountCount(720));

    const runCountStatPromises = [];
    runCountStatPromises.push(getRunCount(24));
    runCountStatPromises.push(getRunCount(72));
    runCountStatPromises.push(getRunCount(168));

    response.serviceCounts["leaderboard"] = LeaderboardCache.size;
    response.serviceCounts["objectIdToName"] = ObjectIDToNameCache.size;
    response.serviceCounts["user"] = UserCache.size;
    response.serviceCounts["flag"] = FlagCache.size;
    response.serviceCounts["token"] = TokenRevokedCache.size;
    response.serviceCounts["seedsOutstanding"] = await getOutstandingSeedCount();

    await Promise.all(loginStatPromises).then(values => {
      addStatToResponse(response, "uniqueUserStats", values);
    });

    await Promise.all(newAccountStatPromises).then(values => {
      addStatToResponse(response, "newAccountStats", values);
    });

    await Promise.all(runCountStatPromises).then(values => {
      addStatToResponse(response, "runCountStats", values);
    });

    res.send(response);
    return;
  }
  //#endregion stats

  //#region configs
  static async getConfigList(req: Request, res: Response) {
    try {
      const configs = (await getConfigListFromDB()) as FullChallengeConfig[];

      const playerCountPromises = [];
      for (const [index, config] of Object.entries(configs)) {
        if (config.record) {
          config.record["time"] = config.record.runID.getTimestamp();
        }
        if (config.active) {
          playerCountPromises.push(
            LeaderboardCache.getChallengePlayerCount(config._id.toString()).then(count => {
              return { index: index, count: count };
            })
          );
        }
      }

      await Promise.all(playerCountPromises).then(results => {
        results.forEach(result => {
          configs[result.index]["playerCount"] = result.count;
        });
      });

      res.send(configs);
      return;
    } catch (e) {
      Logger.logError("AdminController.getConfigList", e);
      res.sendStatus(500);
      return;
    }
  }

  static async getConfigDetails(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await getConfigDetailsByID(id);

      result["playerCount"] = await LeaderboardCache.getChallengePlayerCount(id);

      if (result.records) {
        const modifiedRecords = result.records;
        for (let i = 0; i < modifiedRecords.length; i++) {
          const record = modifiedRecords[i];
          const timestamp = record.runID.getTimestamp();
          modifiedRecords[i].time = timestamp;
        }
        result.records = modifiedRecords;
      }
      res.send(result);
    } catch (e) {
      Logger.logError("AdminController.getConfigDetails", e);
      res.sendStatus(500);
      return;
    }
  }

  static async postConfig(req: Request, res: Response) {
    try {
      const newConfigRequest = req.body;

      const mapPath = newConfigRequest.mapPath;
      const name = newConfigRequest.name;
      const time = parseInt(newConfigRequest.time);
      const homeLimit = parseInt(newConfigRequest.homeLimit);

      if (!mapPath || !time || !name || !homeLimit) {
        res.sendStatus(400);
        return;
      }

      const newConfig = {
        name: name,
        mapPath: mapPath,
        seconds: time,
        homeLimit: homeLimit,
        active: false,
      };

      const resultID = await addNewConfig(newConfig);
      res.send(resultID);
    } catch (e) {
      Logger.logError("AdminController.postConfig", e as Error);
      res.sendStatus(500);
      return;
    }
  }

  static async patchConfig(req: Request, res: Response) {
    try {
      const request = req.body;

      const id = req.params.id;

      const newOrder = request.order;
      const newActive = request.active;
      const newThumbnailURL = request.thumbnailURL;

      const patchRequest: Record<string, unknown> = {};
      if (newOrder !== undefined) {
        if (typeof newOrder !== "number") {
          res.sendStatus(400);
          return;
        } else {
          patchRequest.order = newOrder;
        }
      }

      if (newActive !== undefined) {
        if (typeof newActive !== "boolean") {
          res.sendStatus(400);
          return;
        } else {
          patchRequest.active = newActive;
        }
      }

      if (newThumbnailURL !== undefined) {
        if (typeof newThumbnailURL !== "string") {
          res.sendStatus(400);
          return;
        } else {
          patchRequest.thumbnailURL = newThumbnailURL;
        }
      }

      await updateConfigByID(id, patchRequest);
      res.sendStatus(200);
    } catch (e) {
      Logger.logError("AdminController.patchConfig", e);
      res.sendStatus(500);
      return;
    }
  }
  //#endregion configs

  //#region daily stuff
  static async dailyChallengeSwap(req: Request, res: Response) {
    try {
      await handleDailyChallengeChange();
      res.sendStatus(200);
    } catch (e) {
      Logger.logError("AdminController.generateDailyChallenge", e);
      res.sendStatus(500);
      return;
    }
  }
  //#endregion

  //#region users
  static async getUsers(req: Request, res: Response) {
    try {
      const query = req.query as { by: string; count: string };
      if (query.by === "recentlyCreated") {
        const count = parseInt(query.count);
        if (!count) {
          send400(res, "Must specify count");
          return;
        } else if (count > 25) {
          send400(res, "Count too high");
          return;
        }
        const results = await getRecentlyCreatedUsers(count);
        res.send(results);
      } else if (query.by === "recentlyLoggedIn") {
        const count = parseInt(query.count);
        if (!count) {
          send400(res, "Must specify count");
          return;
        } else if (count > 25) {
          send400(res, "Count too high");
          return;
        }
        const results = await getRecentlyLoggedInUsers(count);
        res.send(results);
      } else {
        send400(res, "Unknown by value");
        return;
      }
    } catch (e) {
      Logger.logError("AdminController.getUsers", e);
      res.sendStatus(500);
      return;
    }
  }

  static async getUserDetails(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const result = await getUserDetailsByID(id);
      const activeChallenges = await getActiveChallenges();

      const rankPromises = [];
      result.activeChallengeDetails = {};
      const userChallengeDetails = result.challengeDetails;
      if (userChallengeDetails) {
        activeChallenges.forEach(challenge => {
          const userDetails = userChallengeDetails.find(details => details.ID.equals(challenge.id));
          if (userDetails) {
            rankPromises.push(
              LeaderboardCache.getChallengeRankByUserId(challenge.id, id).then(rank => {
                return { id: challenge.id, rank: rank };
              })
            );
            result.activeChallengeDetails[challenge.id] = {
              score: userDetails.pb,
              runID: userDetails.pbRunID,
              name: challenge.name,
              runs: userDetails.runs,
              runTime: userDetails.pbRunID.getTimestamp(),
            };
          }
        });

        await Promise.all(rankPromises).then(ranks => {
          ranks.forEach(rank => (result.activeChallengeDetails[rank.id].rank = rank.rank));
        });
      }
      delete result.challengeDetails;

      res.send(result);
    } catch (e) {
      Logger.logError("AdminController.getUserDetails", e);
      res.sendStatus(500);
    }
  }

  static async patchUser(req: Request, res: Response) {
    try {
      const request = req.body;

      const id = req.params.id;

      const newBanned = request.banned;
      const newShowOnLeaderboard = request.showOnLeaderboard;
      const newBanMessage = request.banMessage;

      const patchRequest: Record<string, unknown> = {};
      if (newBanned !== undefined) {
        if (typeof newBanned !== "boolean") {
          res.sendStatus(400);
          return;
        } else {
          patchRequest.banned = newBanned;
          if (!newBanned) patchRequest.banInfo = {};
        }
      }

      if (newShowOnLeaderboard !== undefined) {
        if (typeof newShowOnLeaderboard !== "boolean") {
          res.sendStatus(400);
          return;
        } else {
          patchRequest.showOnLeaderboard = newShowOnLeaderboard;
        }
      }

      if (newBanMessage !== undefined) {
        if (typeof newBanMessage !== "string") {
          res.sendStatus(400);
          return;
        } else {
          patchRequest.banInfo = { message: newBanMessage };
        }
      }

      const newDetails = await updateUserByID(id, patchRequest);
      res.send(newDetails);
    } catch (e) {
      Logger.logError("AdminController.patchUser", e);
      res.sendStatus(500);
      return;
    }
  }
  //#endregion users

  //#region runs
  static async getRuns(req: Request, res: Response) {
    try {
      const query = req.query as { by: string; count: string; tag: string };
      if (query.by === "recent") {
        const count = parseInt(query.count);

        if (!count) {
          send400(res, "Must specify count");
          return;
        } else if (count > 50) {
          send400(res, "Count too high");
          return;
        }

        const runs = (await getRecentRuns(count)) as RunData[];
        await populateUsernamesOnRuns(runs);

        res.send(runs);
      } else if (query.by === "tag") {
        const tag = query.tag;
        const count = parseInt(query.count);

        if (!count || !tag || count > 50) {
          send400(res, "Bad request");
          return;
        }

        const runs = await getRunsByTag(tag, count);
        await populateUsernamesOnRuns(runs);

        res.send(runs);
      } else {
        send400(res, "Unknown by value");
        return;
      }
    } catch (e) {
      Logger.logError("AdminController.getRuns", e);
      res.sendStatus(500);
      return;
    }
  }

  static async getRunDetails(req: Request, res: Response) {
    try {
      const id = req.params.id;

      const details = await getRunDetailsByID(id);
      if (details.userID) details.username = await ObjectIDToNameCache.getUsername(details.userID);

      res.send(details);
    } catch (e) {
      Logger.logError("AdminController.getRunDetails", e);
      res.sendStatus(500);
    }
  }

  static async addRunVerificationTag(req: Request, res: Response) {
    try {
      const runID = req.body.runID;

      await markRunForVerification({ runID });
      res.sendStatus(200);
    } catch (e) {
      Logger.logError("AdminController.markRunForVerification", e);
      res.sendStatus(500);
    }
  }
  //#endregion runs

  //#region championships
  static async getChampionshipList(req: Request, res: Response) {
    try {
      const list = await getChampionshipListFromDB();
      res.send(list);
    } catch (e) {
      Logger.logError("AdminController.getChampionshipList", e);
      res.sendStatus(500);
      return;
    }
  }

  static async getChampionshipDetails(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const details = await getChampionshipDetailsFromDB(id);

      if (details.userPoints) {
        for (let i = 0; i < details.userPoints.length; i++) {
          const entry = details.userPoints[i];
          details.userPoints[i]["username"] = await ObjectIDToNameCache.getUsername(entry.userID);
        }
      }

      for (let i = 0; i < details.configs.length; i++) {
        const configID = details.configs[i];
        const configName = await ObjectIDToNameCache.getChallengeName(configID);
        details.configs[i] = {
          id: configID,
          name: configName,
        };
      }

      res.send(details);
    } catch (e) {
      Logger.logError("AdminController.getChampionshipDetails", e);
      res.sendStatus(500);
    }
  }
  //#endregion championship

  //#region Flags
  static async getFlagList(req: Request, res: Response) {
    try {
      const list = await getFlagListFromDB();
      res.send(list);
    } catch (e) {
      Logger.logError("AdminController.getFlagList", e);
      res.sendStatus(500);
    }
  }

  static async getFlagDetails(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const details = await getFlagDetailsByID(id);
      res.send(details);
    } catch (e) {
      Logger.logError("AdminController.getFlagDetails", e);
      res.sendStatus(500);
    }
  }

  static async patchFlagDetails(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const request = req.body;

      const flagDetails = await getFlagDetailsByID(id);

      const patchRequest: Record<string, unknown> = {};
      switch (flagDetails.type) {
        case "bool":
          if (typeof request.value === "boolean") {
            patchRequest.value = request.value;
          } else {
            send400(res, "Value doesn't match flag type");
            return;
          }
          break;
        case "int":
          if (typeof request.value === "number") {
            patchRequest.value = request.value;
          } else {
            send400(res, "Value doesn't match flag type");
            return;
          }
          break;
        default:
          send400(res, "Flag type not supported");
          return;
      }

      const result = await updateFlagByID(id, patchRequest);
      res.send(result);
    } catch (e) {
      Logger.logError("AdminController.patchFlagDetails", e);
      res.sendStatus(500);
    }
  }
  //#endregion Flags

  //#region Cache
  static dumpLeaderboardCache(req: Request, res: Response) {
    try {
      LeaderboardCache.unsetAll();
      res.sendStatus(200);
    } catch (e) {
      Logger.logError("AdminController.dumpLeaderboardCache", e);
      res.sendStatus(500);
    }
  }

  static dumpUserCache(req: Request, res: Response) {
    try {
      UserCache.unsetAll();
      res.sendStatus(200);
    } catch (e) {
      Logger.logError("AdminController.dumpLeaderboardCache", e);
      res.sendStatus(500);
    }
  }

  static dumpFlagCache(req: Request, res: Response) {
    try {
      FlagCache.unsetAll();
      res.sendStatus(200);
    } catch (e) {
      Logger.logError("AdminController.dumpLeaderboardCache", e);
      res.sendStatus(500);
    }
  }
  //#endregion Cache

  //#region ServiceTokens
  static async generateNewServiceToken(req: Request, res: Response) {
    try {
      const serviceID = req.body.name;

      if (!serviceID) {
        send400(res, "No name provided");
        return;
      }

      let newToken;
      try {
        const randomBytes = crypto.randomBytes(32);
        newToken = randomBytes.toString("hex");
      } catch (e) {
        Logger.logError("AdminController.generateNewServiceToken", e);
        res.sendStatus(503);
        return;
      }

      const tokenHash = await PasswordHandler.generatePasswordHash(newToken);
      const user = req.user as AuthToken;
      await saveNewServiceToken({ tokenHash, name: serviceID, createdBy: user.username });

      res.send(newToken);
    } catch (e) {
      Logger.logError("AuthController.generateNewServiceToken", e);
      res.sendStatus(500);
    }
  }
  //#endregion ServiceTokens

  //#region Auth Control
  static revokeAllTokens(req: Request, res: Response) {
    try {
      TokenRevokedCache.RevokeTokens();

      res.send("OK");
    } catch (e) {
      Logger.logError("AuthController.RevokeAllTokens", e);
      res.sendStatus(500);
    }
  }
  //#endregion
}

const send400 = (res, message) => {
  res.status(400);
  res.send(message);
};
