const { MongoClient } = require("mongodb");

const Options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

class Connection {
  constructor() {
    this.open();
  }

  async open() {
    if (this.db) return this.db;

    let ConnectionString;
    try {
      ConnectionString = require("./dbConnectionString");
    } catch (e) {
      console.log("Connecting with env string");
      ConnectionString = process.env.connection_string;
    }
    this.db = await MongoClient.connect(ConnectionString, Options);
    return this.db;
  }
}
const SingletonInstance = new Connection();
module.exports = SingletonInstance;
