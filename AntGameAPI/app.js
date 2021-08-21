const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("express-jwt");

const app = express();
const port = 8080;

const _challengeController = require("./controller/ChallengeController");
const _authController = require("./auth/AuthController");
const _userController = require("./controller/UserController");
const _adminController = require("./controller/AdminController");
const _flagController = require("./controller/FlagController");
const TokenHandler = require("./auth/WebTokenHandler");
const TokenRevokedHandler = require("./handler/TokenRevokedHandler");
const { RejectNotAdmin } = require("./auth/AuthHelpers");

const UnauthenticatedRoutes = [
  "/auth/login",
  "/auth/anonToken",
  "/auth/register",
  /\/flag*/,
  "/health",
];

const send400 = (res, message) => {
  res.status(400);
  res.send(message);
};

app.use(bodyParser.json({ extended: true }));
app.use(
  jwt({ secret: TokenHandler.secret, algorithms: ["HS256"] }).unless({
    path: UnauthenticatedRoutes,
  }),
  function (err, req, res, next) {
    if (!err) {
      next();
    } else if (err.code === "credentials_required") {
      send400(res, "JWT required");
      return;
    } else if (err.code === "invalid_token") {
      send400(res, "Invalid JWT");
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

    const userID = req.user.id;
    const IsTokenValid = await TokenRevokedHandler.isTokenValid(userID);
    if (IsTokenValid === false) {
      res.sendStatus(401);
      return;
    }
    next();
  }
);

app.get("/admin/stats", RejectNotAdmin, _adminController.getStats);
app.get("/admin/configList", RejectNotAdmin, _adminController.getConfigList);
app.get("/admin/config/:id", RejectNotAdmin, _adminController.getConfigDetails);
app.patch("/admin/config/:id", RejectNotAdmin, _adminController.patchConfig);
// app.get("/admin/users", RejectNotAdmin, _adminController.getUsers)
app.get("/admin/user/:id", RejectNotAdmin, _adminController.getUserDetails);
app.patch("/admin/user/:id", RejectNotAdmin, _adminController.patchUser);
app.get("/admin/runs", RejectNotAdmin, _adminController.getRuns);
app.post("/admin/config", RejectNotAdmin, _adminController.postConfig);

app.get("/flag/:name", _flagController.getFlag);

app.post("/auth/login", _authController.verifyLogin);
app.post("/auth/anonToken", _authController.getAnonymousToken);
app.post("/auth/register", _authController.registerUser);
app.post("/auth/createUser", RejectNotAdmin, _authController.createUser);

app.get("/challenge/:id/records", _challengeController.getRecords);
app.post("/challenge/artifact", _challengeController.postRun);
app.get("/challenge/:id", _challengeController.getChallenge);
app.get("/challenge/:id/pr", _challengeController.getPRHomeLocations);
app.get("/challenges/active", _challengeController.getActiveChallenges);
app.get("/challenge/:id/leaderboard", _challengeController.getLeaderboard);

app.get("/health", (req, res) => res.sendStatus(200));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
