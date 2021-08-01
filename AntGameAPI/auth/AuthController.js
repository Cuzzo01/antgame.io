const AuthDao = require("./AuthDao");
const TokenHandler = require("./WebTokenHandler");
const PasswordHandler = require("./PasswordHandler");
const { RejectNotAdmin } = require("./AuthHelpers");
const { RegistrationDataSatisfiesCriteria } = require("../helpers/RegistrationHelper");

async function verifyLogin(req, res) {
  try {
    const loginRequest = req.body;
    const username = loginRequest.user;
    const password = loginRequest.pass;
    const clientID = loginRequest.clientID;

    if (!username || !password || !clientID) {
      res.sendStatus(400);
      return;
    }

    const authDetails = await AuthDao.getAuthDetailsByUsername(username);
    if (authDetails === false) {
      res.status(401);
      res.send("Invalid login");
      return;
    }

    if (await PasswordHandler.checkPassword(password, authDetails.passHash)) {
      if (authDetails.banned === true) {
        res.status(403);
        res.send("Account banned");
        return;
      }

      const clientIP = GetIpAddress(req);
      await AuthDao.logLogin(authDetails.id, clientIP, clientID);
      const tokenObject = {
        id: authDetails.id,
        username: authDetails.username,
        admin: authDetails.admin,
        clientID: clientID,
      };
      if (authDetails.showOnLeaderboard === false) {
        tokenObject.showOnLeaderboard = false;
      }
      const token = TokenHandler.generateAccessToken(tokenObject);
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
    const token = TokenHandler.generateAccessToken({
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

async function registerUser(req, res) {
  try {
    const request = req.body;
    const username = request.username;
    const password = request.password;
    const email = request.email;
    const clientID = request.clientID;
    const clientIP = GetIpAddress(req);

    if (!RegistrationDataSatisfiesCriteria(username, password, clientID)) {
      res.sendStatus(400);
      return;
    }

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
      admin: false,
      challengeDetails: [],
      showOnLeaderboard: true,
      email: email.length > 0 && email,
      registrationData: {
        clientID: clientID,
        IP: clientIP,
        date: new Date(),
      },
    });

    const tokenObject = {
      id: user._id,
      username: user.username,
      admin: user.admin,
    };
    const token = TokenHandler.generateAccessToken(tokenObject);
    res.send(token);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Could not create user");
  }
}

async function createUser(req, res) {
  try {
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
      showOnLeaderboard: true,
    });
    res.send("OK");
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Could not create user");
  }
}

const GetIpAddress = req => {
  const cfIP = req.headers["do-connecting-ip"];
  if (cfIP) return cfIP;
  const forwardIP = req.headers["x-forwarded-for"];
  if (forwardIP) return forwardIP;
  const sourceIP = req.connection.remoteAddress;
  return sourceIP;
};

module.exports = { verifyLogin, createUser, getAnonymousToken, registerUser };
