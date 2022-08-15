/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/unbound-method */

import dotenv from "dotenv";
if (!process.env.environment) {
  dotenv.config();
}

import express, { Request, Response } from "express";
import jwt from "express-jwt";
import responseTime from "response-time";

import { RejectNotAdmin, ServiceEndpointAuth } from "./auth/AuthHelpersTS";
import { TokenHandlerProvider } from "./auth/WebTokenHandlerTS";
import { JwtResultHandler, ResponseLogger, TokenVerifier } from "./helpers/Middleware";
import {
  failedLoginLimiter,
  getSeedLimiter,
  loginLimiter,
  registrationLimiter,
  runSubmissionLimiter,
} from "./auth/RateLimiters";

import { PublicController } from "./controller/PublicController";
import { AuthController } from "./auth/AuthController";
import { SeedController } from "./controller/SeedController";
import { ReportController } from "./controller/ReportController";
import { UserController } from "./controller/UserController";
import { MapController } from "./controller/MapController";
import { ChampionshipController } from "./controller/ChampionshipController";
import { ServiceController } from "./controller/ServiceController";
import { InitializeTracing } from "./tracing";
import { initializeScheduledTasks } from "./bll/TaskSchedulerTS";

InitializeTracing();

const app = express();
const port = 8080;

const _challengeController = require("./controller/ChallengeController");
const _adminController = require("./controller/AdminController");
const _flagController = require("./controller/FlagController");

const MongoClient = require("./dao/MongoClient");

const TokenHandler = TokenHandlerProvider.getHandler();

const UnauthenticatedRoutes = [
  "/auth/login",
  "/auth/anonToken",
  "/auth/register",
  /\/flag\//,
  /\/service\//,
  /\/public\//,
  "/health",
  "/time",
];

initializeScheduledTasks();

app.use(responseTime(ResponseLogger));
app.use(express.json());

app.use(
  jwt({ secret: TokenHandler.secret, algorithms: ["HS256"] }).unless({
    path: UnauthenticatedRoutes,
  }),
  JwtResultHandler,
  TokenVerifier
);

//#region Admin
app.get("/admin/stats", RejectNotAdmin, _adminController.getStats);

app.get("/admin/users", RejectNotAdmin, _adminController.getUsers);
app.get("/admin/user/:id", RejectNotAdmin, _adminController.getUserDetails);
app.patch("/admin/user/:id", RejectNotAdmin, _adminController.patchUser);

app.get("/admin/runs", RejectNotAdmin, _adminController.getRuns);
app.get("/admin/run/:id", RejectNotAdmin, _adminController.getRunDetails);
app.post("/admin/verifyRun", RejectNotAdmin, _adminController.addRunVerificationTag);

app.get("/admin/configList", RejectNotAdmin, _adminController.getConfigList);
app.get("/admin/config/:id", RejectNotAdmin, _adminController.getConfigDetails);
app.patch("/admin/config/:id", RejectNotAdmin, _adminController.patchConfig);
app.post("/admin/config", RejectNotAdmin, _adminController.postConfig);

app.get("/admin/championshipList", RejectNotAdmin, _adminController.getChampionshipList);
app.get("/admin/championship/:id", RejectNotAdmin, _adminController.getChampionshipDetails);
app.post("/admin/championship/:id/awardPoints", RejectNotAdmin, ChampionshipController.awardPoints);

app.get("/admin/flags", RejectNotAdmin, _adminController.getFlagList);
app.get("/admin/flagData/:id", RejectNotAdmin, _adminController.getFlagDetails);
app.patch("/admin/flagData/:id", RejectNotAdmin, _adminController.patchFlagDetails);

app.post("/admin/dailyChallenge", RejectNotAdmin, _adminController.dailyChallengeSwap);
app.post("/admin/solutionImage", RejectNotAdmin, _adminController.generateAndBindSolutionImage);
app.post("/admin/serviceToken", RejectNotAdmin, _adminController.generateNewServiceToken);
app.delete("/admin/leaderboardCache", RejectNotAdmin, _adminController.dumpLeaderboardCache);
app.delete("/admin/userCache", RejectNotAdmin, _adminController.dumpUserCache);
app.delete("/admin/flagCache", RejectNotAdmin, _adminController.dumpFlagCache);

app.post("/admin/revokeTokens", RejectNotAdmin, _adminController.revokeAllTokens);
//#endregion Admin

app.get("/service/healthCheck", ServiceEndpointAuth, ServiceController.healthCheck);
app.post("/service/recordImage", ServiceEndpointAuth, ServiceController.generateRecordImage);
app.delete(
  "/service/clearLeaderboard/:id",
  ServiceEndpointAuth,
  ServiceController.dumpLeaderboardCache
);
app.delete(
  "/service/clearActiveChallenges",
  ServiceEndpointAuth,
  ServiceController.dumpActiveChallengesCache
);

app.get("/flag/:name", _flagController.getFlag);
app.get("/time", (_: Request, res: Response) => res.send({ now: Date.now() }));

app.get("/map", RejectNotAdmin, MapController.getRandomMap);

app.post("/auth/login", failedLoginLimiter, loginLimiter, AuthController.verifyLogin);
app.post("/auth/anonToken", AuthController.getAnonymousToken);
app.post("/auth/register", registrationLimiter, AuthController.registerUser);

app.post("/challenge/artifact", runSubmissionLimiter, _challengeController.postRun);
app.get("/challenge/:id/records", _challengeController.getRecords);
app.get("/challenge/:id", _challengeController.getChallenge);
app.get("/challenge/:id/pr", _challengeController.getPRHomeLocations);
app.get("/challenges/active", _challengeController.getActiveChallenges);
app.get("/challenge/:id/leaderboard", _challengeController.getLeaderboard);

app.get("/public/activeChallenges", PublicController.getActiveChallenges);
app.get("/public/challengeLeaderboard/:id", PublicController.getChallengeLeaderboard);
app.get("/public/dailyList", PublicController.getDailyChallenges);
app.get("/public/gsgp", PublicController.getGsgpData);
app.get("/public/badges/:id", PublicController.getUserBadges);

app.post("/seed", getSeedLimiter, SeedController.getSeed);

app.get("/championship/:id", ChampionshipController.getLeaderboard);

app.post("/badges", UserController.getUserBadges);

app.post("/report/spaces", ReportController.reportSpacesData);

app.get("/health", async (_: Request, res: Response) => {
  await MongoClient.open();
  if (MongoClient.isConnected) res.sendStatus(200);
  else res.sendStatus(503);
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
