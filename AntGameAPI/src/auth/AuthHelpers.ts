import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { GetIpAddress } from "../helpers/IpHelper";
import { LoggerProvider } from "../LoggerTS";
import { AuthToken } from "./models/AuthToken";
import { PasswordHandler } from "./PasswordHandler";
import { ServiceTokenHandler } from "./ServiceTokenHandler";
import { FlagHandler } from "../handler/FlagHandler";
import { RefreshTokenEntity } from "./dao/entity/RefreshTokenEntity";

const Logger = LoggerProvider.getInstance();
const ServiceTokenCache = ServiceTokenHandler.getCache();
const FlagCache = FlagHandler.getCache();

export const RejectNotAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthToken;
  if (user.admin !== true) {
    Logger.logError("RejectNotAdmin", `illegal admin access attempt by ${user.username}`);
    res.status(401);
    res.send("Not admin");
    return;
  }
  next();
};

export const RejectIfAnon = (req: Request, res: Response) => {
  const user = req.user as AuthToken;
  if (user.anon) {
    res.status(401);
    res.send("Cant be anon");
    return true;
  }
  return false;
};

export const ServiceEndpointAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.get("Authorization");
  const serviceName = req.get("service-id");
  const ip = GetIpAddress(req);

  if (!token || !serviceName) {
    res.status(401);
    res.send("Incomplete auth");
    return;
  }

  const tokenData = await ServiceTokenCache.getTokenData({ serviceName });

  if (tokenData === null) {
    res.status(401);
    res.send("Unknown service");
    return;
  }

  if (!(await PasswordHandler.checkPassword(token, tokenData.hash))) {
    res.send(401);
    res.send("Incorrect token");
    return;
  }

  Logger.logAuthEvent({
    event: "service endpoint hit",
    serviceName,
    ip,
    endpoint: req.originalUrl,
  });
  next();
};

export const GetRefreshTokenExpiresAt = async (persistLogin: boolean) => {
  let tokenAge: number;
  if (persistLogin) {
    tokenAge = await FlagCache.getIntFlag("auth.long-refresh-token-age.hours");
  } else {
    tokenAge = await FlagCache.getIntFlag("auth.short-refresh-token-age.hours");
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + tokenAge);

  return expiresAt;
};

export const GetRefreshToken = async (
  userId: ObjectId,
  clientId: string,
  persistLogin: boolean
) => {
  const token = crypto.randomBytes(32).toString("hex");

  const toReturn: RefreshTokenEntity = {
    expiresAt: await GetRefreshTokenExpiresAt(persistLogin),
    createdAt: new Date(),
    token,
    userId,
    clientId,
    longLivedToken: persistLogin,
  };
  return toReturn;
};
