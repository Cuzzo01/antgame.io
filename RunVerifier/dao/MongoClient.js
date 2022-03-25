const { MongoClient } = require("mongodb");

const Options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

class Connection {
  async open() {
    if (this.db) return this.db;

    console.log(JSON.stringify(process.env))
    const ConnectionString = process.env.connection_string;

    if (ConnectionString.length === 0) throw "No connection string given"

    this.db = await MongoClient.connect(ConnectionString, Options);
    return this.db;
  }
}
const SingletonInstance = new Connection();
module.exports = SingletonInstance;
