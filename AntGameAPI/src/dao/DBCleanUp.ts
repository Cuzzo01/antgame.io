import { MongoConnection } from "./MongoClientTS";
import { LoggerProvider } from "../LoggerTS";
import { Collection } from "mongodb";

const getCollection = async (collection: string): Promise<Collection> => {
  const connection = await MongoConnection.open();
  return connection.db("challenges").collection(collection);
};

const removeAnonAndTagLessRunsOlderThan7Days = async (): Promise<void> => {
  const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;

  try {
    const collection = await getCollection("runs");
    const result = await collection.deleteMany({
      $and: [
        { created: { $lt: new Date(Date.now() - sevenDaysInMilliseconds) } },
        { $or: [{ isAnon: true }, { tags: { $exists: false } }] },
      ],
    });

    LoggerProvider.getInstance().info("DBCleanUp", `Removed ${result.deletedCount} old runs`);
  } catch (err) {
    LoggerProvider.getInstance().logError("DBCleanUp", err);
  }
};

export { removeAnonAndTagLessRunsOlderThan7Days };
