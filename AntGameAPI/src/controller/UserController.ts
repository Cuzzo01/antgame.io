import { Request, Response } from "express";
import { UserHandler } from "../handler/UserHandlerTS";
import { LoggerProvider } from "../LoggerTS";
import { BadgeRequest } from "../models/BadgeRequest";
import { BadgeResponse } from "../models/BadgeResponse";

const Logger = LoggerProvider.getInstance();
const UserCache = UserHandler.getCache();

export class UserController {
  static async getUserBadges(req: Request, res: Response) {
    try {
      const request = req.body as BadgeRequest;
      const userList = request.userList;

      if (!userList || userList.length > 100) {
        res.sendStatus(400);
        return;
      }

      const badgeResponse: BadgeResponse = {};
      for (let i = 0; i < userList.length; i++) {
        const userID = userList[i];

        const badges = await UserCache.getBadges(userID);
        badgeResponse[userID] = badges;
      }

      res.send(badgeResponse);
    } catch (e) {
      Logger.logError("UserController.getUserBadges", e);
      res.send(500);
    }
  }
}
