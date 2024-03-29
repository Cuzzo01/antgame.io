import rateLimit from "express-rate-limit";
import { FlagHandler } from "../handler/FlagHandler";
import { GetIpAddress } from "../helpers/IpHelper";
import { AuthToken } from "./models/AuthToken";
import { LoginRequest } from "./models/LoginRequest";

const FlagCache = FlagHandler.getCache();

export const runSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: "Only 3 runs per user, per minute allowed",
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
  skip: async () => await FlagCache.getBoolFlag("disable-successful-login-limiter"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => (req.body as LoginRequest).user,
  skipFailedRequests: true,
});

export const failedLoginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 100,
  message: "Only 100 failed logins per IP, per 30 minutes allowed",
  skip: async () => await FlagCache.getBoolFlag("disable-failed-login-limiter"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => GetIpAddress(req),
  skipSuccessfulRequests: true,
});

export const accessTokenLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: "Only 20 access tokens per user, per 5 minutes allowed",
  skip: async () => !(await FlagCache.getBoolFlag("enable.access-token-limiter")),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.header("client_id"),
  skipFailedRequests: true,
});

export const failedAccessTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Only 5 failed access token requests per IP, per minute",
  skip: async () => !(await FlagCache.getBoolFlag("enable.failed-access-token-limiter")),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => GetIpAddress(req),
  skipSuccessfulRequests: true,
});

export const failedDeleteTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Only 5 failed access token delete requests per IP, per minute",
  skip: async () => !(await FlagCache.getBoolFlag("enable.failed-delete-token-limiter")),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => GetIpAddress(req),
  skipSuccessfulRequests: true,
});

export const registrationLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  message: "Only 10 new accounts per IP, per 30 minutes allowed",
  skip: async () => await FlagCache.getBoolFlag("disable-account-creation-limiter"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => GetIpAddress(req),
  skipFailedRequests: true,
});

export const reportLimiter = rateLimit({
  windowMs: 6 * 60 * 60 * 1000,
  max: 100,
  message: "Only 100 reports per user, per 6 hours allowed",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => GetIpAddress(req),
  skipFailedRequests: true,
});

export const badgeRateLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 25,
  message: "Only 10 requests per user, per 1 min allowed",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => (req.user ? (req.user as AuthToken).id : GetIpAddress(req)),
});

export const generalRateLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 100,
  message: "Only 10 requests per user, per 1 min allowed",
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: req => GetIpAddress(req),
});
