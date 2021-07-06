const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("express-jwt");

const app = express();
const port = 8080;

const _challengeController = require("./controller/ChallengeController");
const _authController = require("./auth/AuthController");
const _userController = require("./controller/UserController");
const WebTokenHandler = require("./auth/WebTokenHandler");

const UnauthenticatedRoutes = ["/auth/login", "/auth/anonToken"];

app.use(bodyParser.json({ extended: true }));
app.use(
  jwt({ secret: WebTokenHandler.secret, algorithms: ["HS256"] }).unless({
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

app.post("/auth/login", _authController.verifyLogin);
app.post("/auth/anonToken", _authController.getAnonymousToken);
app.post("/auth/createUser", _authController.createUser);

app.get("/challenge/:id/records", _challengeController.getRecords);
app.post("/challenge/artifact", _challengeController.postRun);
app.get("/challenge/:id", _challengeController.getChallenge);
app.get("/challenges/active", _challengeController.getActiveChallenges);
app.get("/challenge/leaderboard/:id", _challengeController.getLeaderboard);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
