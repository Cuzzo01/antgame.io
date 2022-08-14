import { NextFunction, Request, Response } from "express";
import { GetIpAddress } from "../helpers/IpHelperTS";
import { LoggerProvider } from "../LoggerTS";
import { AuthToken } from "./models/AuthToken";
import { PasswordHandler } from "./PasswordHandlerTS";
import { ServiceTokenHandler } from "./ServiceTokenHandlerTS";

const Logger = LoggerProvider.getInstance();
const ServiceTokenCache = ServiceTokenHandler.getCache();

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
