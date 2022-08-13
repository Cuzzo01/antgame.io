const jwt = require("jsonwebtoken");
const Logger = require("../Logger");

class TokenHandler {
  get secret() {
    if (!this._secret) this.init();
    return this._secret;
  }

  init() {
    this._secret = process.env.jwt_secret;
    if (!this._secret || this._secret.length == 0) throw "Failed to load JWT secret";
  }

  generateAccessToken(user) {
    if (user.admin)
      Logger.logAuthEvent(`Issued admin token`, { username: user.username, userID: user.id });
    return jwt.sign(user, this.secret, { expiresIn: "6h" });
  }

  verifyToken(token) {
    if (token == null) return false;
    try {
      return jwt.verify(token, this.secret);
    } catch (e) {
      console.log("Decode token threw:\n", e);
      return false;
    }
  }
}
const SingletonInstance = new TokenHandler();
module.exports = SingletonInstance;
