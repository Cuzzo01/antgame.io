const secret =
  "39e2a7e443df247d9a48cdb22331ddf377685f05482e88824ac50edca2deb7d2fda6afc6a0ad6c8f66cbdb7ee0245eadcb493929ac20bd9d8b40e798db047a69";

const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  return jwt.sign(user, secret, { expiresIn: "4h" });
}

function verifyToken(token) {
  if (token == null) return false;
  try {
    return jwt.verify(token, secret);
  } catch (e) {
    console.log("Decode token threw:\n", e);
    return false;
  }
}

module.exports = { generateAccessToken, verifyToken, secret };
