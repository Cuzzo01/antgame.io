import { Request, Response } from "express";
import { GetIpAddress } from "../helpers/IpHelperTS";
import { LoggerProvider } from "../LoggerTS";
import { PasswordHandler } from "./PasswordHandlerTS";
import { TokenHandlerProvider } from "./WebTokenHandlerTS";
import { IsAllowedUsername, RegistrationDataSatisfiesCriteria } from "./RegistrationHelperTS";
import { FlagHandler } from "../handler/FlagHandler";
import { getAuthDetailsByUsername, IsUsernameTaken, logLogin, saveNewUser } from "./AuthDao";

import { AuthDetails } from "./models/AuthDetails";
import { AuthToken } from "./models/AuthToken";
import { LoginRequest } from "./models/LoginRequest";
import { LoginResponse } from "./models/LoginResponse";
import { RegisterRequest } from "./models/RegisterRequest";

const Logger = LoggerProvider.getInstance();
const TokenHandler = TokenHandlerProvider.getHandler();
const FlagCache = FlagHandler.getCache();

export class AuthController {
  static async verifyLogin(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as LoginRequest;
      const username = request.user;
      const password = request.pass;
      const clientID = request.clientID;
      const clientIP = GetIpAddress(req);

      if (!username || !password || !clientID) {
        res.sendStatus(400);
        return;
      }

      const authDetails = (await getAuthDetailsByUsername(username)) as AuthDetails | false;
      if (authDetails === false) {
        Logger.logAuthEvent({
          event: "login failed - no matching username",
          username: username,
          ip: clientIP,
        });
        res.status(404);
        res.send("No user with that name");
        return;
      }

      if (await PasswordHandler.checkPassword(password, authDetails.passHash)) {
        if (authDetails.banned === true) {
          Logger.logAuthEvent({
            event: "login failed - account banned",
            username: authDetails.username,
            userID: authDetails.id,
            ip: clientIP,
          });
          res.status(403);
          const response: LoginResponse = { banned: true };
          if (authDetails.banInfo) response.message = authDetails.banInfo.message;
          res.send(response);
          return;
        }

        if (authDetails.admin === false) {
          const allowLogin = await FlagCache.getBoolFlag("allow-logins");
          if (allowLogin !== true) {
            res.status(405);
            res.send("logins are disabled");
            return;
          }
        }

        await logLogin(authDetails.id, clientIP, clientID);
        const tokenObject: AuthToken = {
          id: authDetails.id,
          username: authDetails.username,
          admin: authDetails.admin,
          clientID: clientID,
        };
        const token = TokenHandler.generateAccessToken(tokenObject);
        res.send(token);
        Logger.logAuthEvent({
          event: "successful login",
          username: authDetails.username,
          userID: authDetails.id,
          ip: clientIP,
          clientID: clientID,
        });
        return;
      }
      Logger.logAuthEvent({
        event: "login failed - bad password",
        username: authDetails.username,
        userID: authDetails.id,
        ip: clientIP,
      });
      res.status(401);
      res.send("Invalid login");
    } catch (e) {
      Logger.logError("AuthController.verifyLogin", e as Error);
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
      const token = TokenHandler.generateAccessToken({
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
      const user = (await saveNewUser({
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
      })) as AuthDetails;

      Logger.logAuthEvent({ event: "registered new user", username, ip: clientIP, clientID });

      const tokenObject: AuthToken = {
        id: user._id,
        username: user.username,
        admin: user.admin,
        clientID: clientID,
      };
      const token = TokenHandler.generateAccessToken(tokenObject);
      res.send(token);
    } catch (e) {
      Logger.logError("AuthController.registerUser", e as Error);
      res.status(500);
      res.send("Could not create user");
    }
  }
}
