import { NextFunction, Request, Response } from "express";

import { ObjectIDToNameHandler } from "../handler/ObjectIDToNameHandlerTS";
import { TokenRevokedHandler } from "../handler/TokenRevokedHandlerTS";
import { LoggerProvider } from "../LoggerTS";
import { setAttributes } from "../tracing";
import { GetIpAddress } from "./IpHelperTS";
import { FlagHandler } from "../handler/FlagHandler";

import { AuthToken } from "../auth/models/AuthToken";
import { MessageType } from "../models/Logging/MessageTypes";
import { RequestLog } from "../models/Logging/RequestLog";

const Logger = LoggerProvider.getInstance();
const TokenRevokedCache = TokenRevokedHandler.getCache();
const ObjectIDToNameCache = ObjectIDToNameHandler.getCache();
const FlagCache = FlagHandler.getCache();

const send401 = (res: Response, message: string) => {
  res.status(401);
  res.send(message);
};

export const JwtResultHandler = function (
  err: { code: string },
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!err) {
    next();
  } else if (err.code === "credentials_required") {
    send401(res, "JWT required");
    Logger.logAuthEvent({ event: "api hit without JWT", ip: GetIpAddress(req) });
    return;
  } else if (err.code === "invalid_token") {
    send401(res, "Invalid JWT");
    Logger.logAuthEvent({ event: "api hit with invalid JWT", ip: GetIpAddress(req) });
    return;
  }
  Logger.logError("App.jwtHandler", err.code);
  res.status(401);
  res.send("Unauthorized");
};

export const TokenVerifier = async function (req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    next();
    return;
  }

  const user = req.user as AuthToken;

  if (!user.anon) {
    const userID = user.id;
    const adminToken = user.admin === true;
    const tokenIssuedAt = user.iat;
    const clientID = user.clientID;
    const TokenIsValid = await TokenRevokedCache.isTokenValid(userID, adminToken, tokenIssuedAt);

    setAttributes({ userID, clientID, username: await ObjectIDToNameCache.getUsername(userID) });

    if (TokenIsValid === false) {
      Logger.logAuthEvent({
        event: "invalid token received",
        userID,
        adminToken,
        username: user.username,
      });
      res.sendStatus(401);
      return;
    }
  } else {
    const AllowAnon = await FlagCache.getBoolFlag("allow-anon-logins");
    if (!AllowAnon) {
      Logger.logAuthEvent({ event: "received anon token when not allowed" });
      res.sendStatus(401);
      return;
    }
  }

  if (user.admin !== true) {
    const LoginsEnabled = await TokenRevokedCache.AreLoginsEnabled();
    if (!LoginsEnabled) {
      res.sendStatus(401);
      return;
    }
  }
  next();
};

export const ResponseLogger = function (req: Request, res: Response, time: number) {
  if (req.url !== "/health") {
    const toLog: RequestLog = {
      message: MessageType.RequestResponse,
      method: req.method,
      url: req.url,
      ip: GetIpAddress(req),
      time: Math.round(time),
      status: res.statusCode,
    };
    Logger.log(toLog);
  }
};
