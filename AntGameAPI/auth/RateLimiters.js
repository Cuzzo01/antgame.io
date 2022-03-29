const rateLimit = require("express-rate-limit");
const { GetIpAddress } = require("../helpers/IpHelper");
const FlagHandler = require("../handler/FlagHandler");

const runSubmissionLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 4,
  message: "Only 2 runs per user, per minute allowed",
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.user.anon,
  keyGenerator: req => req.user.id,
});

const getSeedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Only 20 seeds per user, per minute allowed",
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.user.anon,
  keyGenerator: req => req.user.id,
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Only 5 logins per user, per 5 minutes allowed",
  skip: async () => await FlagHandler.getFlagValue("disable-successful-login-limiter"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.body.user,
  skipFailedRequests: true,
});

const failedLoginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 100,
  message: "Only 100 failed logins per IP, per 30 minutes allowed",
  skip: async () => await FlagHandler.getFlagValue("disable-failed-login-limiter"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => GetIpAddress(req),
  skipSuccessfulRequests: true,
});

const registrationLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  message: "Only 10 new accounts per IP, per 30 minutes allowed",
  skip: async () => await FlagHandler.getFlagValue("disable-account-creation-limiter"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => GetIpAddress(req),
  skipFailedRequests: true,
});

module.exports = {
  runSubmissionLimiter,
  getSeedLimiter,
  loginLimiter,
  failedLoginLimiter,
  registrationLimiter,
};
