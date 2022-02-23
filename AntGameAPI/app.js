if (!process.env.environment) require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("express-jwt");
const rateLimit = require("express-rate-limit");

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
const TokenHandler = require("./auth/WebTokenHandler");
const TokenRevokedHandler = require("./handler/TokenRevokedHandler");
const { RejectNotAdmin } = require("./auth/AuthHelpers");
const responseTime = require("response-time");
const { GetIpAddress } = require("./helpers/IpHelper");
const Logger = require("./Logger");
const { initializeScheduledTasks } = require("./bll/TaskScheduler");

const UnauthenticatedRoutes = [
  "/auth/login",
  "/auth/anonToken",
  "/auth/register",
  /\/flag\//,
  "/health",
  "/time",
];

const send401 = (res, message) => {
  res.status(401);
  res.send(message);
};

initializeScheduledTasks();

app.use(bodyParser.json({ extended: true, limit: "50mb" }));

app.use(
  responseTime((req, res, time) => {
    if (req.url !== "/health") {
      Logger.log({
        message: "request response",
        method: req.method,
        url: req.url,
        ip: GetIpAddress(req),
        time: Math.round(time),
        status: res.statusCode,
      });
    }
  })
);

app.use(
  jwt({ secret: TokenHandler.secret, algorithms: ["HS256"] }).unless({
    path: UnauthenticatedRoutes,
  }),
  function (err, req, res, next) {
    if (!err) {
      next();
    } else if (err.code === "credentials_required") {
      send401(res, "JWT required");
      Logger.logAuthEvent("api hit without JWT", { ip: GetIpAddress(req) });
      return;
    } else if (err.code === "invalid_token") {
      send401(res, "Invalid JWT");
      Logger.logAuthEvent("api hit with invalid JWT", { ip: GetIpAddress(req) });
      return;
    }
    console.log("Unknown AuthError:", err);
    res.status(401);
    res.send("Unauthorized");
  },
  async function (req, res, next) {
    if (!req.user) {
      next();
      return;
    }

    if (req.user.anon !== true) {
      const userID = req.user.id;
      const adminToken = req.user.admin === true;
      const TokenIsValid = await TokenRevokedHandler.isTokenValid(userID, adminToken);
      if (TokenIsValid === false) {
        Logger.logAuthEvent("invalid token received", {
          userID,
          adminToken,
          username: req.user.username,
        });
        res.sendStatus(401);
        return;
      }
    }

    if (req.user.admin !== true) {
      const LoginsEnabled = await TokenRevokedHandler.AreLoginsEnabled();
      if (!LoginsEnabled) {
        res.sendStatus(401);
        return;
      }
    }
    next();
  }
);

const runSubmissionLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 4,
  message: "Only 2 runs per min allowed",
  standardHeaders: true,
  skip: req => req.user.anon,
  keyGenerator: req => req.user.id,
});

//#region Admin
app.get("/admin/stats", RejectNotAdmin, _adminController.getStats);

app.get("/admin/users", RejectNotAdmin, _adminController.getUsers);
app.get("/admin/user/:id", RejectNotAdmin, _adminController.getUserDetails);
app.patch("/admin/user/:id", RejectNotAdmin, _adminController.patchUser);

app.get("/admin/runs", RejectNotAdmin, _adminController.getRuns);
app.get("/admin/run/:id", RejectNotAdmin, _adminController.getRunDetails);

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
app.delete("/admin/leaderboardCache", RejectNotAdmin, _adminController.dumpLeaderboardCache);
app.delete("/admin/userCache", RejectNotAdmin, _adminController.dumpUserCache);
//#endregion Admin

app.get("/flag/:name", _flagController.getFlag);
app.get("/time", (req, res) => res.send({ now: Date.now() }));

app.get("/map", RejectNotAdmin, _mapController.getRandomMap);

app.post("/auth/login", _authController.verifyLogin);
app.post("/auth/anonToken", _authController.getAnonymousToken);
app.post("/auth/register", _authController.registerUser);
app.post("/auth/createUser", RejectNotAdmin, _authController.createUser);

app.post("/challenge/artifact", runSubmissionLimiter, _challengeController.postRun);
app.get("/challenge/:id/records", _challengeController.getRecords);
app.get("/challenge/dailyList", _challengeController.getDailyChallenges);
app.get("/challenge/:id", _challengeController.getChallenge);
app.get("/challenge/:id/pr", _challengeController.getPRHomeLocations);
app.get("/challenges/active", _challengeController.getActiveChallenges);
app.get("/challenge/:id/leaderboard", _challengeController.getLeaderboard);

app.get("/championship/:id", _championshipController.getLeaderboard);

app.get("/user/:id/badges", _userController.getUserBadges);

app.post("/report/spaces", _reportController.reportSpacesData);

app.get("/health", (req, res) => res.sendStatus(200));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
