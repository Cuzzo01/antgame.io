const jwt = require("jsonwebtoken");

class TokenHandler {
  constructor() {
    try {
      this.secret = require("./secret.js");
    } catch (e) {
      console.log("Loading secret from env");
      this.secret = process.env.jwt_secret;
    }
    if (!this.secret || this.secret.length == 0) throw "Failed to load JWT secret";
  }

  generateAccessToken(user) {
    return jwt.sign(user, this.secret, { expiresIn: "4h" });
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
