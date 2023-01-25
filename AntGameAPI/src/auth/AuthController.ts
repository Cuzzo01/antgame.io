import { Request, Response } from "express";
import { GetIpAddress } from "../helpers/IpHelper";
import { LoggerProvider } from "../LoggerTS";
import { PasswordHandler } from "./PasswordHandler";
import { TokenHandlerProvider } from "./WebTokenHandler";
import { IsAllowedUsername, RegistrationDataSatisfiesCriteria } from "./RegistrationHelper";
import { FlagHandler } from "../handler/FlagHandler";
import { getAuthDetailsByUsername, IsUsernameTaken, logLogin, saveNewUser } from "./AuthDao";
import { RefreshTokenDao } from "./dao/RefreshTokenDao";
import { UserDao } from "../dao/UserDao";
import { GetRefreshToken, GetRefreshTokenExpiresAt } from "./AuthHelpers";

import { AuthDetails } from "./models/AuthDetails";
import { AuthToken } from "./models/AuthToken";
import { LoginRequest } from "./models/LoginRequest";
import { LoginResponse } from "./models/LoginResponse";
import { RegisterRequest } from "./models/RegisterRequest";

const Logger = LoggerProvider.getInstance();
const TokenHandler = TokenHandlerProvider.getHandler();
const FlagCache = FlagHandler.getCache();

const _userDao = new UserDao();
const _refreshTokenDao = new RefreshTokenDao();

export class AuthController {
  static async verifyLogin(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as LoginRequest;
      const clientIP = GetIpAddress(req);

      if (!request.user || !request.pass || !request.clientID) {
        res.sendStatus(400);
        return;
      }

      if (request.persistLogin === undefined) request.persistLogin = false;

      const authDetails = (await getAuthDetailsByUsername(request.user)) as AuthDetails | false;
      if (authDetails === false) {
        Logger.logAuthEvent({
          event: "login failed - no matching username",
          username: request.user,
          ip: clientIP,
        });
        res.status(404);
        res.send("No user with that name");
        return;
      }

      const loginsEnabled = await FlagCache.getBoolFlag("allow-logins");
      if (authDetails.admin === false && !loginsEnabled) {
        res.status(405);
        res.send("logins are disabled");
        return;
      }

      const validLogin = await PasswordHandler.checkPassword(request.pass, authDetails.passHash);
      if (!validLogin) {
        Logger.logAuthEvent({
          event: "login failed - bad password",
          username: authDetails.username,
          userID: authDetails._id.toString(),
          ip: clientIP,
        });
        res.status(401);
        res.send("Invalid login");
        return;
      }

      if (authDetails.banned === true) {
        Logger.logAuthEvent({
          event: "login failed - account banned",
          username: authDetails.username,
          userID: authDetails._id.toString(),
          ip: clientIP,
        });
        res.status(403);
        const response: LoginResponse = { banned: true };
        if (authDetails.banInfo) response.message = authDetails.banInfo.message;
        res.send(response);
        return;
      }

      await logLogin(authDetails._id.toString(), clientIP, request.clientID);

      const refreshToken = await GetRefreshToken(
        authDetails._id,
        request.clientID,
        request.persistLogin
      );
      await _refreshTokenDao.saveNewToken(refreshToken);

      res.cookie("refresh_token", refreshToken.token, {
        expires: refreshToken.expiresAt,
        secure: true,
        sameSite: "strict",
      });

      const tokenObject: AuthToken = {
        id: refreshToken.userId.toString(),
        username: authDetails.username,
        admin: authDetails.admin,
        clientID: request.clientID,
      };
      const token = await TokenHandler.generateAccessToken(tokenObject);
      res.send(token);

      Logger.logAuthEvent({
        event: "issued refresh token",
        username: authDetails.username,
        userID: authDetails._id.toString(),
        ip: clientIP,
        clientID: request.clientID,
      });
    } catch (e) {
      Logger.logError("AuthController.verifyLogin", e as Error);
      res.status(500);
      res.send("Login failed");
    }
  }

  static async deleteRefreshToken(req: Request, res: Response): Promise<void> {
    try {
      const tokenString = (req.cookies as { refresh_token: string }).refresh_token;

      const deleteResult = await _refreshTokenDao.deleteTokenRecord(tokenString);

      Logger.logAuthEvent({
        event: `call to delete refresh token - ${deleteResult ? "" : "un"}successful`,
        ip: GetIpAddress(req),
      });

      res.clearCookie("refresh_token");
      if (deleteResult) res.sendStatus(204);
      else res.sendStatus(404);
    } catch (e) {
      Logger.logError("AuthController.deleteRefreshToken", e as Error);
      res.status(500);
      res.send("Delete failed");
    }
  }

  static async getAccessToken(req: Request, res: Response): Promise<void> {
    try {
      const clientId = req.headers["client_id"] as string;
      const tokenString = (req.cookies as { refresh_token: string }).refresh_token;
      const clientIP = GetIpAddress(req);

      if (!clientId || !tokenString) {
        Logger.logAuthEvent({
          event: "received incomplete refresh access token request",
          ip: clientIP,
        });
        res.status(401);
        res.send("Incomplete auth request");
        return;
      }

      const refreshToken = await _refreshTokenDao.getTokenRecord(tokenString);
      if (refreshToken === false) {
        Logger.logAuthEvent({
          event: "received unknown refresh token",
          ip: clientIP,
        });
        res.status(401);
        res.clearCookie("refresh_token");
        res.send("Unknown refresh token");
        return;
      }

      if (refreshToken.clientId !== clientId) {
        Logger.logAuthEvent({
          event: "received refresh token with non-matching clientId",
          ip: clientIP,
          userID: refreshToken.userId.toString(),
        });
        res.status(401);
        res.clearCookie("refresh_token");
        res.send("Non-matching clientId");
        return;
      }

      const newExpiresAt = await GetRefreshTokenExpiresAt(refreshToken.longLivedToken);
      await _refreshTokenDao.renewRefreshToken(tokenString, newExpiresAt);

      const userDetails = await _userDao.getUserDetails(undefined, refreshToken.userId);
      const tokenObject: AuthToken = {
        id: refreshToken.userId.toString(),
        username: userDetails.username,
        admin: userDetails.admin,
        clientID: clientId,
      };

      res.cookie("refresh_token", refreshToken.token, {
        expires: newExpiresAt,
        secure: true,
        sameSite: "strict",
      });

      const token = await TokenHandler.generateAccessToken(tokenObject);
      res.send(token);

      Logger.logAuthEvent({
        event: "issued access token",
        username: userDetails.username,
        userID: userDetails._id.toString(),
        ip: clientIP,
        clientID: clientId,
      });
    } catch (e) {
      Logger.logError("AuthController.getAccessToken", e as Error);
      res.status(500);
      res.send("Login failed");
    }
  }

  static async getAnonymousToken(req: Request, res: Response): Promise<void> {
    try {
      if (!(await FlagCache.getBoolFlag("allow-anon-logins"))) {
        res.status(405);
        res.send("Anon logins are disabled");
        return;
      }

      const data = req.body as LoginRequest;
      const clientID = data.clientID;
      const clientIP = GetIpAddress(req);

      if (!clientID) {
        res.status(400);
        res.send("Client ID required");
        return;
      }
      Logger.logAuthEvent({ event: "Issued anon token", clientID: data.clientID, ip: clientIP });
      const token = await TokenHandler.generateAccessToken({
        clientID: data.clientID,
        anon: true,
        admin: false,
      });
      res.send(token);
      return;
    } catch (e) {
      Logger.logError("AuthController.getAnonymousToken", e as Error);
      res.status(500);
      res.send("Login failed");
    }
  }

  static async registerUser(req: Request, res: Response) {
    try {
      const request = req.body as RegisterRequest;
      const username = request.username;
      const password = request.password;
      const email = request.email;
      const clientID = request.clientID;
      const clientIP = GetIpAddress(req);

      if (!RegistrationDataSatisfiesCriteria(username, password, clientID)) {
        res.sendStatus(400);
        return;
      }

      if (!(await FlagCache.getBoolFlag("allowAccountRegistration"))) {
        res.sendStatus(406);
        return;
      }

      if (!IsAllowedUsername(username)) {
        Logger.logAuthEvent({
          event: "register attempt with non-allowed username",
          username: username,
          ip: clientIP,
        });
        res.status(409);
        res.send("Username taken");
        return;
      }

      const usernameTaken = await IsUsernameTaken(username);
      if (usernameTaken) {
        Logger.logAuthEvent({
          event: "register attempt with already used username",
          username: username,
          ip: clientIP,
        });
        res.status(409);
        res.send("Username taken");
        return;
      }

      const hashedPassword = await PasswordHandler.generatePasswordHash(password);
      await saveNewUser({
        username: username,
        passHash: hashedPassword,
        admin: false,
        challengeDetails: [],
        email: email.length > 0 && email,
        registrationData: {
          clientID: clientID,
          IP: clientIP,
          date: new Date(),
        },
      });
      Logger.logAuthEvent({ event: "registered new user", username, ip: clientIP, clientID });

      const user = (await getAuthDetailsByUsername(username)) as AuthDetails;
      const tokenObject: AuthToken = {
        id: user._id.toString(),
        username: user.username,
        admin: user.admin,
        clientID: clientID,
      };
      const token = await TokenHandler.generateAccessToken(tokenObject);
      res.send(token);
    } catch (e) {
      Logger.logError("AuthController.registerUser", e as Error);
      res.status(500);
      res.send("Could not create user");
    }
  }
}
