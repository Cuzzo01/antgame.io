const Connection = require("../dao/MongoClient");
const Mongo = require("mongodb");

const getCollection = async collection => {
  const connection = await Connection.open();
  return await connection.db("challenges").collection(collection);
};

const runScript = async () => {
  const collection = await getCollection("users");
  const accountsWithLoginRecords = await collection
    .find(
      { "loginRecords.0.IP": { $exists: true }, loginCount: { $exists: false } },
      { projection: { loginRecords: 1 } }
    )
    .toArray();
  const updateList = [];
  console.log(accountsWithLoginRecords.length);
  for (let i = 0; i < accountsWithLoginRecords.length; i++) {
    const account = accountsWithLoginRecords[i];
    updateList.push({
      id: account._id,
      count: account.loginRecords.length,
    });
  }

  console.log(updateList.length);
  for (let i = 0; i < updateList.length; i++) {
    const updateRecord = updateList[i];
    console.log(updateRecord);
    const updateObject = {
      loginCount: updateRecord.count,
    };
    if (updateRecord.count === 10) updateObject.loginOverflow = true;
    console.log(updateObject);
    const result = await collection.updateOne({ _id: updateRecord.id }, { $set: updateObject });
    if (result.result.ok === 1) console.log(`Updated successfully`);
    else console.log(result);
  }
};

runScript();
