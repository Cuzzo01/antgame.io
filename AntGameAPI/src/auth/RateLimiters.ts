import rateLimit from "express-rate-limit";
import { GetIpAddress } from "../helpers/IpHelperTS";
import { AuthToken } from "./models/AuthToken";
import { LoginRequest } from "./models/LoginRequest";

const FlagHandler = require("../handler/FlagHandler");

export const runSubmissionLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 4,
  message: "Only 2 runs per user, per minute allowed",
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => (req.user as AuthToken).anon,
  keyGenerator: req => (req.user as AuthToken).id,
});

export const getSeedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Only 20 seeds per user, per minute allowed",
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => (req.user as AuthToken).anon,
  keyGenerator: req => (req.user as AuthToken).id,
});

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Only 5 logins per user, per 5 minutes allowed",
  skip: async () => await FlagHandler.getFlagValue("disable-successful-login-limiter"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => (req.body as LoginRequest).user,
  skipFailedRequests: true,
});

export const failedLoginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 100,
  message: "Only 100 failed logins per IP, per 30 minutes allowed",
  skip: async () => await FlagHandler.getFlagValue("disable-failed-login-limiter"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => GetIpAddress(req),
  skipSuccessfulRequests: true,
});

export const registrationLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  message: "Only 10 new accounts per IP, per 30 minutes allowed",
  skip: async () => await FlagHandler.getFlagValue("disable-account-creation-limiter"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => GetIpAddress(req),
  skipFailedRequests: true,
});
