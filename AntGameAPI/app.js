if (!process.env.environment) require("dotenv").config();

require("./tracing");

const express = require("express");
const jwt = require("express-jwt");

const app = express();
const port = 8080;

const _challengeController = require("./controller/ChallengeController");
const _authController = require("./auth/AuthController");
const _adminController = require("./controller/AdminController");
const _flagController = require("./controller/FlagController");
const _mapController = require("./controller/MapController");
const _championshipController = require("./controller/ChampionshipController");
const _reportController = require("./controller/ReportController");
const _userController = require("./controller/UserController");
const _seedController = require("./controller/SeedController");
const _serviceController = require("./controller/ServiceController");
const _publicController = require("./controller/PublicController");

const TokenHandler = require("./auth/WebTokenHandler");
const { RejectNotAdmin, ServiceEndpointAuth } = require("./auth/AuthHelpers");
const responseTime = require("response-time");
const { initializeScheduledTasks } = require("./bll/TaskScheduler");
const SpacesService = require("./services/SpacesService");
const MongoClient = require("./dao/MongoClient");
const {
  runSubmissionLimiter,
  getSeedLimiter,
  loginLimiter,
  failedLoginLimiter,
  registrationLimiter,
} = require("./auth/RateLimiters");
const { JwtResultHandler, TokenVerifier, ResponseLogger } = require("./helpers/Middleware");

const UnauthenticatedRoutes = [
  "/auth/login",
  "/auth/anonToken",
  "/auth/register",
  /\/flag\//,
  /\/service\//,
  /\/public\//,
  /\/user\/[A-z0-9]*\/badges/,
  "/health",
  "/time",
];

initializeScheduledTasks();
SpacesService.initializeConnection();

app.use(express.json());

app.use(responseTime(ResponseLogger));

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
app.post(
  "/admin/championship/:id/awardPoints",
  RejectNotAdmin,
  _championshipController.awardPoints
);

app.get("/admin/flags", RejectNotAdmin, _adminController.getFlagList);
app.get("/admin/flagData/:id", RejectNotAdmin, _adminController.getFlagDetails);
app.patch("/admin/flagData/:id", RejectNotAdmin, _adminController.patchFlagDetails);

app.post("/admin/dailyChallenge", RejectNotAdmin, _adminController.dailyChallengeSwap);
app.post("/admin/solutionImage", RejectNotAdmin, _adminController.generateAndBindSolutionImage);
app.post("/admin/serviceToken", RejectNotAdmin, _adminController.generateNewServiceToken);
app.delete("/admin/leaderboardCache", RejectNotAdmin, _adminController.dumpLeaderboardCache);
app.delete("/admin/userCache", RejectNotAdmin, _adminController.dumpUserCache);
app.delete("/admin/flagCache", RejectNotAdmin, _adminController.dumpFlagCache);
//#endregion Admin

app.get("/service/healthCheck", ServiceEndpointAuth, _serviceController.healthCheck);
app.post("/service/recordImage", ServiceEndpointAuth, _serviceController.generateRecordImage);
app.delete(
  "/service/clearLeaderboard/:id",
  ServiceEndpointAuth,
  _serviceController.dumpLeaderboardCache
);
app.delete(
  "/service/clearActiveChallenges",
  ServiceEndpointAuth,
  _serviceController.dumpActiveChallengesCache
);

app.get("/flag/:name", _flagController.getFlag);
app.get("/time", (req, res) => res.send({ now: Date.now() }));

app.get("/map", RejectNotAdmin, _mapController.getRandomMap);

app.post("/auth/login", failedLoginLimiter, loginLimiter, _authController.verifyLogin);
app.post("/auth/anonToken", _authController.getAnonymousToken);
app.post("/auth/register", registrationLimiter, _authController.registerUser);
app.post("/auth/createUser", RejectNotAdmin, _authController.createUser);

app.post("/challenge/artifact", runSubmissionLimiter, _challengeController.postRun);
app.get("/challenge/:id/records", _challengeController.getRecords);
app.get("/challenge/dailyList", _challengeController.getDailyChallenges);
app.get("/challenge/:id", _challengeController.getChallenge);
app.get("/challenge/:id/pr", _challengeController.getPRHomeLocations);
app.get("/challenges/active", _challengeController.getActiveChallenges);
app.get("/challenge/:id/leaderboard", _challengeController.getLeaderboard);

app.get("/public/activeChallenges", _publicController.getActiveChallenges);

app.post("/seed", getSeedLimiter, _seedController.getSeed);

app.get("/championship/:id", _championshipController.getLeaderboard);

app.get("/user/:id/badges", _userController.getUserBadges);

app.post("/report/spaces", _reportController.reportSpacesData);

app.get("/health", async (req, res) => {
  await MongoClient.open();
  if (MongoClient.isConnected) res.sendStatus(200);
  else res.sendStatus(503);
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
