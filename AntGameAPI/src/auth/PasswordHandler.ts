import Bcrypt from "bcrypt";

export class PasswordHandler {
  static generatePasswordHash = async (plainTextPassword: string) => {
    return await Bcrypt.hash(plainTextPassword, 10);
  };

  static checkPassword = async (plainTextPassword: string, hash: string) => {
    return await Bcrypt.compare(plainTextPassword, hash);
  };
}
