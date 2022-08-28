/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/unbound-method */

import dotenv from "dotenv";
if (!process.env.environment) {
  dotenv.config();
}

import "./tracing";

import express, { Request, Response } from "express";
import jwt from "express-jwt";
import responseTime from "response-time";

import { RejectNotAdmin, ServiceEndpointAuth } from "./auth/AuthHelpers";
import { TokenHandlerProvider } from "./auth/WebTokenHandler";
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
import { initializeScheduledTasks } from "./bll/TaskScheduler";
import { FlagController } from "./controller/FlagController";
import { ChallengeController } from "./controller/ChallengeController";
import { AdminController } from "./controller/AdminController";

const app = express();
const port = 8080;

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
app.get("/admin/stats", RejectNotAdmin, AdminController.getStats);

app.get("/admin/users", RejectNotAdmin, AdminController.getUsers);
app.get("/admin/user/:id", RejectNotAdmin, AdminController.getUserDetails);
app.patch("/admin/user/:id", RejectNotAdmin, AdminController.patchUser);

app.get("/admin/runs", RejectNotAdmin, AdminController.getRuns);
app.get("/admin/run/:id", RejectNotAdmin, AdminController.getRunDetails);
app.post("/admin/verifyRun", RejectNotAdmin, AdminController.addRunVerificationTag);

app.get("/admin/configList", RejectNotAdmin, AdminController.getConfigList);
app.get("/admin/config/:id", RejectNotAdmin, AdminController.getConfigDetails);
app.patch("/admin/config/:id", RejectNotAdmin, AdminController.patchConfig);
app.post("/admin/config", RejectNotAdmin, AdminController.postConfig);

app.get("/admin/championshipList", RejectNotAdmin, AdminController.getChampionshipList);
app.get("/admin/championship/:id", RejectNotAdmin, AdminController.getChampionshipDetails);
app.post("/admin/championship/:id/awardPoints", RejectNotAdmin, ChampionshipController.awardPoints);

app.get("/admin/flags", RejectNotAdmin, AdminController.getFlagList);
app.get("/admin/flagData/:id", RejectNotAdmin, AdminController.getFlagDetails);
app.patch("/admin/flagData/:id", RejectNotAdmin, AdminController.patchFlagDetails);

app.post("/admin/dailyChallenge", RejectNotAdmin, AdminController.dailyChallengeSwap);
app.post("/admin/serviceToken", RejectNotAdmin, AdminController.generateNewServiceToken);
app.delete("/admin/leaderboardCache", RejectNotAdmin, AdminController.dumpLeaderboardCache);
app.delete("/admin/userCache", RejectNotAdmin, AdminController.dumpUserCache);
app.delete("/admin/flagCache", RejectNotAdmin, AdminController.dumpFlagCache);

app.post("/admin/revokeTokens", RejectNotAdmin, AdminController.revokeAllTokens);
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

app.get("/flag/:name", FlagController.getFlag);
app.get("/time", (_: Request, res: Response) => res.send({ now: Date.now() }));

app.get("/map", RejectNotAdmin, MapController.getRandomMap);

app.post("/auth/login", failedLoginLimiter, loginLimiter, AuthController.verifyLogin);
app.post("/auth/anonToken", AuthController.getAnonymousToken);
app.post("/auth/register", registrationLimiter, AuthController.registerUser);

app.post("/challenge/artifact", runSubmissionLimiter, ChallengeController.postRun);
app.get("/challenge/:id/records", ChallengeController.getRecords);
app.get("/challenge/:id", ChallengeController.getChallenge);
app.get("/challenge/:id/pr", ChallengeController.getPRHomeLocations);
app.get("/challenges/active", ChallengeController.getActiveChallenges);
app.get("/challenge/:id/leaderboard", ChallengeController.getLeaderboard);

app.get("/public/activeChallenges", PublicController.getActiveChallenges);
app.get("/public/challengeLeaderboard/:id", PublicController.getChallengeLeaderboard);
app.get("/public/dailyList", PublicController.getDailyChallenges);
app.get("/public/gsgp", PublicController.getGsgpData);
app.get("/public/badges/:id", PublicController.getUserBadges);
app.get("/public/user/:username", PublicController.getUserInfo);

app.post("/seed", getSeedLimiter, SeedController.getSeed);

app.get("/championship/:id", ChampionshipController.getLeaderboard);

app.post("/badges", UserController.getUserBadges);

app.post("/report/spaces", ReportController.reportSpacesData);

app.get("/health", (_: Request, res: Response) => {
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
