import { Request, Response } from "express";
import { AuthToken } from "../auth/models/AuthToken";
import { SeedBrokerProvider } from "../bll/SeedBroker";
import {
  addTagToRun,
  getChallengeByChallengeId,
  getRecordByChallenge,
  getRunDataByRunId,
  markRunForVerification,
  submitRun,
  updateChallengeRecord,
} from "../dao/ChallengeDao";
import { shouldShowUserOnLeaderboard } from "../dao/UserDao";
import { ActiveChallengesHandler } from "../handler/ActiveChallengesHandler";
import { FlagHandler } from "../handler/FlagHandler";
import { LeaderboardHandler } from "../handler/LeaderboardHandler";
import { MapHandler } from "../handler/MapHandler";
import { VerifyArtifact } from "../helpers/ChallengeRunHelper";
import { GetIpAddress } from "../helpers/IpHelper";
import { LoggerProvider } from "../LoggerTS";
import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { FullRunData } from "../models/FullRunData";
import { ChallengeRecord } from "../models/ChallengeRecord";
import { HomeFoodAmounts, RunRequest } from "../models/RunArtifact";
import { RunSubmissionResponse } from "../models/RunSubmissionResponse";
import { RunTag } from "../models/RunTag";
import { DailyChallengeHandler } from "../handler/DailyChallengeHandler";
import { ChallengeResponse } from "../models/ChallengeResponse";
import { ObjectId } from "mongodb";
import { TryParseObjectID } from "../dao/helpers";
import { Records, RecordsEntry } from "../models/ActiveChallengeResponse";
import { ObjectIDToNameHandler } from "../handler/ObjectIDToNameHandler";
import { RejectIfAnon } from "../auth/AuthHelpers";
import { TimeHelper } from "../helpers/TimeHelperTS";
import { GenerateChallengeLeaderboardData } from "../helpers/LeaderboardHelper";
import { LeaderboardEntry } from "../models/LeaderboardEntry";
import { ChallengeRecordDao } from "../dao/ChallengeRecordDao";
import { ChallengeRecordEntity } from "../dao/entities/ChallengeRecordEntity";
import { LeaderboardEntryWithUsername } from "../models/LeaderboardEntryWithUsername";

const Logger = LoggerProvider.getInstance();
const FlagCache = FlagHandler.getCache();
const MapCache = MapHandler.getCache();
const SeedBroker = SeedBrokerProvider.getBroker();
const LeaderboardCache = LeaderboardHandler.getCache();
const ActiveChallengesCache = ActiveChallengesHandler.getCache();
const DailyChallengeCache = DailyChallengeHandler.getCache();
const ObjectIDToNameCache = ObjectIDToNameHandler.getCache();

const _challengeRecordDao = new ChallengeRecordDao();

export class ChallengeController {
  static async postRun(req: Request, res: Response) {
    try {
      const user = req.user as AuthToken;
      const runData = (req.body as RunRequest).data;

      const runTags: RunTag[] = [];

      let saveRun: boolean | string = false;

      const RejectUnverifiedRuns = await FlagCache.getBoolFlag("reject-anticheat-fail-runs");

      const challengeConfig = (await getChallengeByChallengeId(
        runData.challengeID
      )) as FullChallengeConfig;
      if (!challengeConfig) {
        Logger.logError(
          "ChallengeController.PostRun",
          `Run submitted unknown challenge: ${runData.challengeID}, ${user.username}`
        );
        res.sendStatus(409);
        return;
      }

      if (challengeConfig.active === false && user.admin !== true) {
        Logger.logError(
          "ChallengeController.PostRun",
          `Run submitted on inactive challenge: ${challengeConfig.name}, ${user.username}`
        );
        res.sendStatus(409);
        return;
      }

      if (runData.Score === null || runData.ClientID === null) {
        res.sendStatus(400);
      }

      let verificationResult: string | false;
      try {
        let mapPath: string;
        if (challengeConfig.mapID)
          mapPath = (await MapCache.getMapData({ mapID: challengeConfig.mapID.toString() })).url;

        verificationResult = VerifyArtifact({
          runData,
          clientID: user.clientID,
          challengeConfig,
          mapPath,
        });
      } catch (e) {
        Logger.logError("ChallengeController.PostRun", e as Error);
        res.sendStatus(400);
        return;
      }
      if (verificationResult !== "verified") {
        if (RejectUnverifiedRuns === false) verificationResult += " *IGNORED*";
        runTags.push({ type: "failed verification", metadata: { reason: verificationResult } });
        saveRun = "Verify Failed";
      }

      let seedCreateDate: Date;
      if (!user.anon) {
        const minAgeSeconds = challengeConfig.seconds - Math.ceil(challengeConfig.seconds * 0.02);
        const { isValid, message, seedCreateTime } = await SeedBroker.checkSeed({
          seed: runData.GameConfig.seed,
          userID: user.id,
          homeLocations: runData.HomeLocations,
          minAgeSeconds,
        });
        seedCreateDate = seedCreateTime;

        if (!isValid) {
          verificationResult = false;
          runTags.push({
            type: "failed verification",
            metadata: { reason: "Invalid seed", message },
          });
          saveRun = "Verify Failed";
        }
      }

      let currentRecord: ChallengeRecordEntity;
      let isPB = false;
      if (!user.anon) {
        if (verificationResult === "verified" || RejectUnverifiedRuns === false) {
          currentRecord = await _challengeRecordDao.getRecord(runData.challengeID, user.id);
          if (currentRecord === null) {
            isPB = true;
            saveRun = "New challenge";
          } else if (currentRecord.score < runData.Score) {
            isPB = true;
            saveRun = "New PB";
          }

          if (isPB)
            runTags.push({
              type: "pr",
              metadata: { runNumber: (currentRecord ? currentRecord.runs : 0) + 1 },
            });
        }
      }

      if (saveRun === false) {
        // Where save limiting logic will live in the future
        // Only set to true % of time you want random run saved
        saveRun = true;
      }

      let runID: ObjectId;
      if (saveRun) {
        const runRecord: FullRunData = {
          score: runData.Score,
          submissionTime: new Date(),
          name: runData.Name,
          challengeID: runData.challengeID,
          clientID: runData.ClientID,
          env: runData.Env,
          details: {
            homeLocations: runData.HomeLocations,
            timing: runData.Timing,
            foodConsumed: runData.FoodConsumed,
            seed: runData.GameConfig.seed,
            seedCreateDate,
          },
          tags: runTags,
        };

        const snapshots = [];
        try {
          const startSnapshot = runData.Snapshots.start;
          const startHomeCounts = JSON.parse(startSnapshot[5] as string) as HomeFoodAmounts;
          const finishSnapshot = runData.Snapshots.finish;
          const finishHomeCounts = JSON.parse(finishSnapshot[5] as string) as HomeFoodAmounts;
          snapshots[0] = [...startSnapshot.slice(0, 5), startHomeCounts, ...startSnapshot.slice(6)];
          snapshots[1] = [
            ...finishSnapshot.slice(0, 5),
            finishHomeCounts,
            ...finishSnapshot.slice(6),
          ];
        } catch (e) {
          Logger.logError("ChallengeController.PostRun", e as Error);
          runRecord.tags.push({ type: "Unparsable snapshots" });
        }
        runRecord.details.snapshots = snapshots ? snapshots : runData.Snapshots;

        if (user.id) {
          runRecord.userID = user.id;
        } else {
          runRecord.userID = false;
          runRecord.IP = GetIpAddress(req);
        }
        runID = (await submitRun(runRecord)) as ObjectId;

        if (RejectUnverifiedRuns && verificationResult !== "verified") {
          res.sendStatus(418);
          return;
        }

        if (!user.anon) {
          if (isPB && currentRecord === null) {
            await _challengeRecordDao.addNewRecord(
              runData.challengeID,
              user.id,
              runData.Score,
              runID
            );
          } else if (isPB) {
            await _challengeRecordDao.updateRecord(
              runData.challengeID,
              user.id,
              runData.Score,
              runID
            );
          } else {
            await _challengeRecordDao.incrementRunCount(runData.challengeID, user.id);
          }

          if (isPB) {
            LeaderboardCache.unsetItem(runData.challengeID);
            await markRunForVerification({
              runID,
              priority: challengeConfig.dailyChallenge ? 1 : 5,
            });
          }

          const response: RunSubmissionResponse = {};
          if (await FlagCache.getFlagValue("show-player-count-in-challenge")) {
            const playerCount = await LeaderboardCache.getChallengePlayerCount(runData.challengeID);
            response.playerCount = playerCount;
          }

          let isWorldRecord = false;
          const challengeRecord = (await getRecordByChallenge(
            runData.challengeID
          )) as ChallengeRecord;
          if (isPB) {
            const recordEmpty = challengeRecord && Object.keys(challengeRecord).length === 0;
            if (recordEmpty || challengeRecord.score < runData.Score) {
              const showUser = await shouldShowUserOnLeaderboard(user.id);
              if (showUser) {
                isWorldRecord = true;
                await updateChallengeRecord(
                  runData.challengeID,
                  runData.Score,
                  user.username,
                  user.id,
                  runID
                );

                await addTagToRun(runID, { type: "wr" });
                ActiveChallengesCache.unsetItem();
              }
            }
          }

          response.rank = await LeaderboardCache.getChallengeRankByUserId(
            runData.challengeID,
            user.id
          );
          response.pr = (
            await LeaderboardCache.getChallengeEntryByUserID(runData.challengeID, user.id)
          ).pb;

          if (isWorldRecord) {
            response.wr = {
              score: runData.Score,
              name: user.username,
              id: user.id,
            };
            response.isWrRun = true;
          } else if (challengeRecord) {
            response.wr = {
              score: challengeRecord.score,
              name: challengeRecord.username,
              id: challengeRecord.id,
            };
          }

          res.send(response);
          return;
        }
      }
      res.send("Ok");
    } catch (e) {
      Logger.logError("ChallengeController.PostRun", e as Error);
      res.status(500);
      res.send("Save failed");
    }
  }

  static async getChallenge(req: Request, res: Response) {
    try {
      let id: string | ObjectId = req.params.id;
      const user = req.user as AuthToken;
      if (id.toLowerCase() === "daily") {
        id = await DailyChallengeCache.getActiveDailyChallenge();
      }

      const config = (await getChallengeByChallengeId(id)) as FullChallengeConfig | false;
      if (config === false) {
        res.status(400);
        res.send("Invalid challenge ID");
        return;
      }

      if (!config.active && !user.admin) {
        res.status(400);
        res.send("Challenge not active");
        return;
      }

      const toReturn: ChallengeResponse = {
        id: config.id,
        seconds: config.seconds,
        homeLimit: config.homeLimit,
        name: config.name,
        active: config.active,
        mapPath: undefined,
      };

      if (config.mapID) {
        const mapData = await MapCache.getMapData({ mapID: config.mapID.toString() });
        if (await FlagCache.getFlagValue("use-spaces-proxy")) {
          toReturn.mapPath = `https://antgame.io/assets/${mapData.url}`;
        } else {
          toReturn.mapPath = `https://antgame.nyc3.digitaloceanspaces.com/${mapData.url}`;
        }
      } else {
        toReturn.mapPath = config.mapPath;
      }

      res.send(toReturn);
    } catch (e) {
      Logger.logError("ChallengeController.GetChallenge", e as Error);
      res.status(500);
      res.send("Get challenge failed");
    }
  }

  static async getReplayConfig(req: Request, res: Response) {
    try {
      const id: string | ObjectId = req.params.id;
      const user = req.user as AuthToken;

      const config = (await getChallengeByChallengeId(id)) as FullChallengeConfig | false;
      if (config === false) {
        res.status(400);
        res.send("Invalid challenge ID");
        return;
      }

      const toReturn = {
        id: config.id,
        seconds: config.seconds,
        name: config.name,
        mapPath: undefined,
        wrData: undefined,
        prData: undefined,
      };

      if (config.mapID) {
        const mapData = await MapCache.getMapData({ mapID: config.mapID.toString() });
        if (await FlagCache.getFlagValue("use-spaces-proxy")) {
          toReturn.mapPath = `https://antgame.io/assets/${mapData.url}`;
        } else {
          toReturn.mapPath = `https://antgame.nyc3.digitaloceanspaces.com/${mapData.url}`;
        }
      } else {
        toReturn.mapPath = config.mapPath;
      }

      if(!config.active && config.dailyChallenge){
        const wrRunInfo = await LeaderboardCache.getChallengeEntryByRank(id, 1);
        if (wrRunInfo) {
          const wrRunData = (await getRunDataByRunId(wrRunInfo.runID)) as {
            homeLocations: number[][];
            homeAmounts: { [location: string]: number };
            seed: number;
          };
          toReturn.wrData = {
            locations: wrRunData.homeLocations,
            amounts: wrRunData.homeAmounts,
            seed: wrRunData.seed,
          };
        }
      }

      if (!user.anon) {
        const prRunInfo = await LeaderboardCache.getChallengeEntryByUserID(id, user.id);
        if (prRunInfo) {
          const prRunData = (await getRunDataByRunId(prRunInfo.runID)) as {
            homeLocations: number[][];
            homeAmounts: { [location: string]: number };
            seed: number;
          };
          toReturn.prData = {
            locations: prRunData.homeLocations,
            amounts: prRunData.homeAmounts,
            seed: prRunData.seed,
          };
        }
      }

      res.send(toReturn);
    } catch (e) {
      Logger.logError("ChallengeController.getReplayConfig", e as Error);
      res.status(500);
      res.send("Get challenge failed");
    }
  }

  static async getActiveChallenges(req: Request, res: Response) {
    try {
      const user = req.user as AuthToken;

      const activeChallengeData = await ActiveChallengesCache.getActiveChallenges();
      const activeChallenges = activeChallengeData.challenges;
      const worldRecords = activeChallengeData.worldRecords;

      const challengeIDList: ObjectId[] = [];
      activeChallenges.forEach(challenge => {
        challengeIDList.push(TryParseObjectID(challenge.id, "ChallengeID"));
      });

      const records: Records = {};
      for (const [id, wr] of Object.entries(worldRecords)) {
        records[id] = { wr: wr };
      }

      const activeUserRecords = await _challengeRecordDao.getUserRecords(user.id, challengeIDList);

      if (activeUserRecords) {
        const shouldGetRanks = await FlagCache.getFlagValue("show-rank-on-challenge-list");

        const rankPromises: Promise<{ id: string; rank: number }>[] = [];
        activeUserRecords.forEach(userRecord => {
          const challengeID = userRecord.challengeId.toString();
          records[challengeID].pb = userRecord.score;
          records[challengeID].runs = userRecord.runs;

          if (shouldGetRanks) {
            rankPromises.push(
              LeaderboardCache.getChallengeRankByUserId(challengeID, user.id).then(rank => {
                return {
                  id: challengeID,
                  rank: rank,
                };
              })
            );
          }
        });

        await Promise.all(rankPromises).then(rankResults => {
          rankResults.forEach(rank => {
            records[rank.id].rank = rank.rank;
          });
        });
      }

      let championshipData = await ActiveChallengesCache.getChampionshipData();
      let yesterdaysDailyData = await ActiveChallengesCache.getYesterdaysDailyData();

      const userOnChampionshipLeaderboard = championshipData.leaderboard.some(entry =>
        entry._id.equals(user.id)
      );
      if (!userOnChampionshipLeaderboard) {
        const { found, entry, rank } = await LeaderboardCache.getChampionshipEntryByUserId(
          championshipData.id,
          user.id
        );
        if (found) {
          const leaderboardCopy = [...championshipData.leaderboard];
          leaderboardCopy[leaderboardCopy.length - 1] = <LeaderboardEntryWithUsername>{
            _id: new ObjectId(user.id),
            username: user.username,
            points: entry.points,
            rank,
          };
          championshipData = { ...championshipData };
          championshipData.leaderboard = leaderboardCopy;
        }
      }

      const userOnYesterdaysLeaderboard = yesterdaysDailyData.leaderboardData.some(
        entry => entry.id === user.id
      );
      if (!userOnYesterdaysLeaderboard) {
        const challengeId = yesterdaysDailyData.id;
        const pr = await LeaderboardCache.getChallengeEntryByUserID(challengeId, user.id);
        if (pr) {
          const currentUserRank = await LeaderboardCache.getChallengeRankByUserId(
            challengeId,
            user.id
          );

          const timeString = TimeHelper.getTimeStringForDailyChallenge(pr.runID);

          const personalEntry: LeaderboardEntry = {
            id: user.id,
            rank: currentUserRank,
            username: user.username,
            pb: pr.pb,
            age: timeString,
            extra: true,
          };

          const leaderboardCopy = [...yesterdaysDailyData.leaderboardData];
          leaderboardCopy[leaderboardCopy.length - 1] = personalEntry;
          yesterdaysDailyData = { ...yesterdaysDailyData };
          yesterdaysDailyData.leaderboardData = leaderboardCopy;
        }
      }
      res.send({ challenges: activeChallenges, championshipData, yesterdaysDailyData, records });
    } catch (e) {
      Logger.logError("ChallengeController.GetActiveChallenges", e as Error);
      res.status(500);
      res.send("Get challenge failed");
    }
  }

  static async getRecords(req: Request, res: Response) {
    try {
      const challengeID = req.params.id;
      const user = req.user as AuthToken;

      const response: RecordsEntry = {};
      const worldRecord = (await getRecordByChallenge(challengeID)) as {
        score: number;
        username: string;
        id: string;
      };
      if (Object.keys(worldRecord).length !== 0)
        response.wr = {
          score: worldRecord.score,
          name: worldRecord.username,
          id: worldRecord.id,
        };

      if (!user.anon) {
        const challengeDetails = await _challengeRecordDao.getRecord(challengeID, user.id);
        if (challengeDetails !== null) {
          const rank = await LeaderboardCache.getChallengeRankByUserId(challengeID, user.id);
          response.pr = challengeDetails.score;
          response.rank = rank;
        }
      }

      if (await FlagCache.getFlagValue("show-player-count-in-challenge")) {
        const playerCount = await LeaderboardCache.getChallengePlayerCount(challengeID);
        response.playerCount = playerCount;
      }

      res.send(response);
    } catch (e) {
      Logger.logError("ChallengeController.GetRecords", e as Error);
      res.status(500);
      res.send("Get run details failed");
    }
  }

  static async getLeaderboard(req: Request, res: Response) {
    try {
      const user = req.user as AuthToken;
      let challengeId: string = req.params.id;
      let page: number;
      try {
        page = parseInt(req.params.page);
      } catch (e) {
        res.sendStatus(400);
        return;
      }

      const currentDaily = await DailyChallengeCache.getActiveDailyChallenge();
      const getCurrentDaily = challengeId.toLowerCase() === "daily";
      if (getCurrentDaily) challengeId = currentDaily.toString();

      const leaderboardData = await GenerateChallengeLeaderboardData(challengeId, page);

      if (leaderboardData === false) {
        res.status(404);
        res.send("Found no records for that challengeID and page");
        return;
      }

      const details = (await getChallengeByChallengeId(challengeId)) as FullChallengeConfig;
      const isDaily = details.dailyChallenge === true;

      const leaderboardRows = leaderboardData.leaderboardRows;
      const onLeaderboard = leaderboardRows.find(r => r.id === user.id) !== undefined;

      const isCurrentDaily = getCurrentDaily || currentDaily.equals(challengeId);
      if (!onLeaderboard) {
        const pr = await LeaderboardCache.getChallengeEntryByUserID(challengeId, user.id);
        if (pr) {
          const currentUserRank = await LeaderboardCache.getChallengeRankByUserId(
            challengeId,
            user.id
          );

          const timeString =
            isDaily && !isCurrentDaily
              ? TimeHelper.getTimeStringForDailyChallenge(pr.runID)
              : TimeHelper.getGeneralizedTimeStringFromObjectID(pr.runID) + " ago";

          const personalEntry: LeaderboardEntry = {
            id: user.id,
            rank: currentUserRank,
            username: user.username,
            pb: pr.pb,
            age: timeString,
            extra: true,
          };

          if (currentUserRank < leaderboardRows[0].rank) leaderboardRows.unshift(personalEntry);
          else leaderboardRows.push(personalEntry);
        }
      }

      let solutionImgPath: string | undefined;
      if (details.solutionImage) {
        if (await FlagCache.getFlagValue("use-spaces-proxy")) {
          solutionImgPath = "https://antgame.io/assets/" + details.solutionImage;
        } else {
          solutionImgPath = "https://antgame.nyc3.digitaloceanspaces.com/" + details.solutionImage;
        }
      }

      const response = {
        name: await ObjectIDToNameCache.getChallengeName(challengeId),
        leaderboard: leaderboardRows,
        daily: isDaily,
        active: details.active,
        solutionImage: solutionImgPath,
        playerCount: await LeaderboardCache.getChallengePlayerCount(challengeId),
        pageLength: await FlagCache.getIntFlag("leaderboard-length"),
      };

      res.send(response);
    } catch (e) {
      Logger.logError("ChallengeController.GetLeaderboard", e as Error);
      res.status(500);
      res.send("Get leader board failed");
    }
  }

  static async getPRHomeLocations(req: Request, res: Response) {
    try {
      if (RejectIfAnon(req, res)) return;

      const user = req.user as AuthToken;
      const challengeID = req.params.id;

      const prRun = await LeaderboardCache.getChallengeEntryByUserID(challengeID, user.id);
      if (!prRun) {
        res.status(404);
        res.send("No PR found");
        return;
      }

      const result = (await getRunDataByRunId(prRun.runID)) as {
        homeLocations: number[][];
        homeAmounts: { [location: string]: number };
      };
      res.send({ locations: result.homeLocations, amounts: result.homeAmounts });
    } catch (e) {
      Logger.logError("ChallengeController.GetPRHomeLocations", e as Error);
      res.status(500);
      res.send("Get leader board failed");
    }
  }
}
