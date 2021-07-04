const Bcrypt = require("bcrypt");

const generatePasswordHash = async (plainTextPassword) => {
  return await Bcrypt.hash(plainTextPassword, 10);
};

const checkPassword = async (plainTextPassword, hash) => {
  return await Bcrypt.compare(plainTextPassword, hash);
};

module.exports = { generatePasswordHash, checkPassword };
