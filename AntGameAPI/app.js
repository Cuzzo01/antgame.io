const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("express-jwt");

const app = express();
const port = 8080;

const _challengeController = require("./controller/ChallengeController");
const _authController = require("./auth/AuthController");
const _userController = require("./controller/UserController");
const _adminController = require("./controller/AdminController");
const TokenHandler = require("./auth/WebTokenHandler");
const { RejectNotAdmin } = require("./auth/AuthHelpers");

const UnauthenticatedRoutes = ["/auth/login", "/auth/anonToken", "/auth/register"];

app.use(bodyParser.json({ extended: true }));
app.use(
  jwt({ secret: TokenHandler.secret, algorithms: ["HS256"] }).unless({
    path: UnauthenticatedRoutes,
  }),
  function (err, req, res, next) {
    if (!err) {
      next();
    } else if (err.code === "credentials_required") {
      res.status(401);
      res.send("JWT required");
      return;
    } else if (err.code === "invalid_token") {
      res.status(401);
      res.send("Invalid JWT");
      return;
    }
    console.log("Unknown AuthError:", err);
    res.status(401);
    res.send("Unauthorized");
  }
);

app.get("/admin/stats", RejectNotAdmin, _adminController.getStats);
app.get("/admin/configList", RejectNotAdmin, _adminController.getConfigList);
app.get("/admin/config/:id", RejectNotAdmin, _adminController.getConfigDetails);
app.put("/admin/config/:id", RejectNotAdmin, _adminController.putConfig);
app.post("/admin/config", RejectNotAdmin, _adminController.postConfig);

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

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
