import { LoggerProvider } from "../LoggerTS";
import jwt from "jsonwebtoken";
import { AuthToken } from "./models/AuthToken";
import { FlagHandler } from "../handler/FlagHandler";

const Logger = LoggerProvider.getInstance();
const FlagCache = FlagHandler.getCache();

export class TokenHandlerProvider {
  private static handler: TokenHandler;

  static getHandler(): TokenHandler {
    if (this.handler) return this.handler;
    this.handler = new TokenHandler();
    return this.handler;
  }
}

class TokenHandler {
  private _secret: string;

  get secret() {
    if (!this._secret) this.init();
    return this._secret;
  }

  init() {
    this._secret = process.env.jwt_secret;
    if (!this._secret || this._secret.length == 0) throw "Failed to load JWT secret";
  }

  async generateAccessToken(user: AuthToken) {
    if (user.admin)
      Logger.logAuthEvent({
        event: "Issued admin token",
        username: user.username,
        userID: user.id,
      });

    const tokenAge = await FlagCache.getIntFlag("auth.access-token-age.hours");
    return jwt.sign(user, this.secret, { expiresIn: `${tokenAge}h` });
  }

  verifyToken(token: string) {
    if (token == null) return false;
    try {
      return jwt.verify(token, this.secret);
    } catch (e) {
      console.log("Decode token threw:\n", e);
      return false;
    }
  }
}
