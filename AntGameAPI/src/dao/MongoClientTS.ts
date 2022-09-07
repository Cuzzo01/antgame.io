import { MongoClient, MongoClientOptions } from "mongodb";

const Options: MongoClientOptions = {};

export class MongoConnection {
  private static db: MongoClient;

  static async open() {
    if (this.db) return this.db;

    const ConnectionString = process.env.connection_string;

    this.db = await MongoClient.connect(ConnectionString, Options);
    return this.db;
  }
}
