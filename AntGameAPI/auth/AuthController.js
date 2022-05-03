const AuthDao = require("./AuthDao");
const TokenHandler = require("./WebTokenHandler");
const PasswordHandler = require("./PasswordHandler");
const FlagHandler = require("../handler/FlagHandler");
const {
  RegistrationDataSatisfiesCriteria,
  IsAllowedUsername,
} = require("../helpers/RegistrationHelper");
const { GetIpAddress } = require("../helpers/IpHelper");
const Logger = require("../Logger");

async function verifyLogin(req, res) {
  try {
    const loginRequest = req.body;
    const username = loginRequest.user;
    const password = loginRequest.pass;
    const clientID = loginRequest.clientID;
    const clientIP = GetIpAddress(req);

    if (!username || !password || !clientID) {
      res.sendStatus(400);
      return;
    }

    const authDetails = await AuthDao.getAuthDetailsByUsername(username);
    if (authDetails === false) {
      Logger.logAuthEvent("login failed - no matching username", {
        username,
        ip: clientIP,
      });
      res.status(404);
      res.send("No user with that name");
      return;
    }

    if (await PasswordHandler.checkPassword(password, authDetails.passHash)) {
      if (authDetails.banned === true) {
        Logger.logAuthEvent("login failed - account banned", {
          username: authDetails.username,
          userID: authDetails.id,
          ip: clientIP,
        });
        res.status(403);
        const response = { banned: true };
        if (authDetails.banInfo) response.message = authDetails.banInfo.message;
        res.send(response);
        return;
      }

      if (authDetails.admin === false) {
        const allowLogin = await FlagHandler.getFlagValue("allow-logins");
        if (allowLogin !== true) {
          res.status(405);
          res.send("logins are disabled");
          return;
        }
      }

      await AuthDao.logLogin(authDetails.id, clientIP, clientID);
      const tokenObject = {
        id: authDetails.id,
        username: authDetails.username,
        admin: authDetails.admin,
        clientID: clientID,
      };
      const token = TokenHandler.generateAccessToken(tokenObject);
      res.send(token);
      Logger.logAuthEvent("successful login", {
        username,
        userID: authDetails.id,
        ip: clientIP,
        clientID,
      });
      return;
    }
    Logger.logAuthEvent("login failed - bad password", {
      username: authDetails.username,
      userID: authDetails.id,
      ip: clientIP,
    });
    res.status(401);
    res.send("Invalid login");
  } catch (e) {
    Logger.logError("AuthController.verifyLogin", e);
    res.status(500);
    res.send("Login failed");
  }
}

async function getAnonymousToken(req, res) {
  try {
    if (!(await FlagHandler.getFlagValue("allow-anon-logins"))) {
      res.status(405);
      res.send("Anon logins are disabled");
      return;
    }

    const data = req.body;
    const clientID = data.clientID;
    const clientIP = GetIpAddress(req);

    if (!clientID) {
      res.status(400);
      res.send("Client ID required");
      return;
    }
    Logger.logAuthEvent("Issued anon token", { clientID: data.clientID, ip: clientIP });
    const token = TokenHandler.generateAccessToken({
      clientID: data.clientID,
      anon: true,
      admin: false,
    });
    res.send(token);
    return;
  } catch (e) {
    Logger.logError("AuthController.getAnonymousToken", e);
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

    if ((await FlagHandler.getFlagValue("allowAccountRegistration")) === false) {
      res.sendStatus(406);
      return;
    }

    if (!IsAllowedUsername(username)) {
      Logger.logAuthEvent("register attempt with non-allowed username", {
        username: username,
        ip: clientIP,
      });
      res.status(409);
      res.send("Username taken");
      return;
    }

    const usernameTaken = await AuthDao.IsUsernameTaken(username);
    if (usernameTaken) {
      Logger.logAuthEvent("register attempt with already used username", {
        username: username,
        ip: clientIP,
      });
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

    Logger.logAuthEvent("registered new user", { username, ip: clientIP, clientID });

    const tokenObject = {
      id: user._id,
      username: user.username,
      admin: user.admin,
      clientID: clientID,
    };
    const token = TokenHandler.generateAccessToken(tokenObject);
    res.send(token);
  } catch (e) {
    Logger.logError("AuthController.registerUser", e);
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
    Logger.logError("AuthController.createUser", e);
    res.status(500);
    res.send("Could not create user");
  }
}
module.exports = { verifyLogin, createUser, getAnonymousToken, registerUser };
