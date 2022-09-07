import { Collection, ObjectId, UpdateResult } from "mongodb";
import { TryParseObjectID } from "../dao/helpers";
import { MongoConnection } from "../dao/MongoClientTS";
import { UserChallengeDetails } from "../models/UserChallengeDetails";

export const MigrateUsers = async (runOnce = true) => {
  let count = 0;
  const startTime = new Date();
  do {
    const toMigrate = await getUserToMigrate();
    if (toMigrate === null) {
      console.log(new Date().toISOString(), "Didn't find any users to migrate");
      break;
    }
    console.log(new Date().toISOString(), `Migrating user ${toMigrate.toString()}`);
    await MigrateUser(toMigrate);
    console.log(new Date().toISOString(), `Finished migrating ${toMigrate.toString()}`);
    count++;
  } while (!runOnce);
  const endTime = new Date();
  const elapsed = endTime.getTime() - startTime.getTime();
  console.log(new Date().toISOString(), `Migrated ${count} users, took ${elapsed / 1000} seconds`);
  const cleanUpCount = await CleanUpMigrationFlag();
  console.log(new Date().toISOString(), `Cleaned up ${cleanUpCount} users`);
};

export const CleanUpMigrationFlag = async () => {
  const collection = await getCollection("users");
  const result = (await collection.updateMany(
    { migrated: true },
    { $unset: { migrated: "" } }
  )) as UpdateResult;
  return result.modifiedCount;
};

const MigrateUser = async (userId: ObjectId) => {
  const records = await getUserRecords(userId);
  for (const record of records) {
    const challengeObjectId = TryParseObjectID(record.ID, "ChallengeId");
    const runObjectId = TryParseObjectID(record.pbRunID, "RunId");
    await addNewRecordEntry(challengeObjectId, userId, record.pb, runObjectId, record.runs);
  }
  console.log(
    new Date().toISOString(),
    `Migrated ${records.length} records for ${userId.toString()}`
  );
};

const getUserToMigrate = async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const collection = (await getCollection("users")) as unknown as Collection<{
    _id: ObjectId;
    challengeDetails: UserChallengeDetails[];
    migrated: null | boolean;
  }>;
  const result = await collection.findOneAndUpdate(
    { challengeDetails: { $ne: [] }, migrated: null },
    { $set: { migrated: true } }
  );
  if (!result.value) return null;
  return result.value._id;
};

const addNewRecordEntry = async (
  challengeId: ObjectId,
  userId: ObjectId,
  score: number,
  runId: ObjectId,
  runs: number
) => {
  const collection = await getCollection("challenge-records");
  await collection.insertOne({
    challengeId,
    userId,
    runId,
    runs: runs,
    score,
  });
};

const getUserRecords = async (userId: ObjectId) => {
  const collection = await getCollection("users");
  const userRecord = await collection.findOne(
    { _id: userId },
    { projection: { challengeDetails: 1 } }
  );
  return userRecord.challengeDetails as UserChallengeDetails[];
};

const getCollection = async (name: string) => {
  const connection = await MongoConnection.open();
  return connection.db("challenges").collection(name);
};
