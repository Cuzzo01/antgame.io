const { GetIpAddress } = require("./IpHelper");
const Logger = require("../Logger");
const TelemAPI = require("@opentelemetry/api");
const ObjectIDToNameHandler = require("../handler/ObjectIDToNameHandler");

const TokenRevokedHandler = require("../handler/TokenRevokedHandler");
const FlagHandler = require("../handler/FlagHandler");

const send401 = (res, message) => {
  res.status(401);
  res.send(message);
};

const JwtResultHandler = function (err, req, res, next) {
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
  Logger.logError("App.jwtHandler", err);
  res.status(401);
  res.send("Unauthorized");
};

const TokenVerifier = async function (req, res, next) {
  if (!req.user) {
    next();
    return;
  }

  if (!req.user.anon) {
    const userID = req.user.id;
    const adminToken = req.user.admin === true;
    const tokenIssuedAt = req.user.iat;
    const TokenIsValid = await TokenRevokedHandler.isTokenValid(userID, adminToken, tokenIssuedAt);

    let activeSpan = TelemAPI.trace.getSpan(TelemAPI.context.active());
    activeSpan.setAttribute("user.id", userID);
    activeSpan.setAttribute("user.name", await ObjectIDToNameHandler.getUsername(userID));

    if (TokenIsValid === false) {
      Logger.logAuthEvent("invalid token received", {
        userID,
        adminToken,
        username: req.user.username,
      });
      res.sendStatus(401);
      return;
    }
  } else {
    const AllowAnon = await FlagHandler.getFlagValue("allow-anon-logins");
    if (!AllowAnon) {
      Logger.logAuthEvent("received anon token when not allowed");
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
};

const ResponseLogger = function (req, res, time) {
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
};

module.exports = { JwtResultHandler, TokenVerifier, ResponseLogger };
