const { MongoClient } = require("mongodb");

const Options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

class Connection {
  async open() {
    if (this.db) return this.db;

    const ConnectionString = process.env.connection_string;

    this.db = await MongoClient.connect(ConnectionString, Options);
    return this.db;
  }
}
const SingletonInstance = new Connection();
module.exports = SingletonInstance;
