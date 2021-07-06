const AuthDao = require("./AuthDao");
const WebTokenHandler = require("./WebTokenHandler");
const PasswordHandler = require("./PasswordHandler");
const { RejectNotAdmin } = require("./AuthHelpers");

async function verifyLogin(req, res) {
  try {
    const loginRequest = req.body;
    const username = loginRequest.user;
    const password = loginRequest.pass;

    const authDetails = await AuthDao.getAuthDetailsByUsername(username);
    if (authDetails === false) {
      res.status(401);
      res.send("Invalid login");
      return;
    }
    if (await PasswordHandler.checkPassword(password, authDetails.passHash)) {
      const tokenObject = {
        id: authDetails.id,
        username: authDetails.username,
        admin: authDetails.admin,
      };
      if (authDetails.showOnLeaderboard === false) {
        tokenObject.showOnLeaderboard = false;
      }
      const token = WebTokenHandler.generateAccessToken(tokenObject);
      res.send(token);
      return;
    }
    res.status(401);
    res.send("Invalid login");
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Login failed");
  }
}

async function getAnonymousToken(req, res) {
  try {
    const data = req.body;
    const clientID = data.clientID;
    if (!clientID) {
      res.status(400);
      res.send("Client ID required");
      return;
    }
    const token = WebTokenHandler.generateAccessToken({
      clientID: data.clientID,
      anon: true,
      admin: false,
    });
    res.send(token);
    return;
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Login failed");
  }
}

async function createUser(req, res) {
  try {
    if (RejectNotAdmin(req, res)) return;
    const request = req.body;
    const username = request.username;
    const password = request.password;
    const admin = request.admin;

    const usernameTaken = await AuthDao.IsUsernameTaken(username);
    if (usernameTaken) {
      res.status(409);
      res.send("Username taken");
      return;
    }

    const hashedPassword = await PasswordHandler.generatePasswordHash(password);
    const user = await AuthDao.saveNewUser({
      username: username,
      passHash: hashedPassword,
      admin: admin,
      challengeDetails: [],
    });
    res.send("OK");
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Could not create user");
  }
}

module.exports = { verifyLogin, createUser, getAnonymousToken };
