const { MongoClient } = require("mongodb");

const ConnectionString = require("./dbConnectionString");
const Options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

class Connection {
  static async open() {
    if (this.db) return this.db;
    this.db = await MongoClient.connect(ConnectionString, Options);
    return this.db;
  }
}
module.exports = { Connection };
