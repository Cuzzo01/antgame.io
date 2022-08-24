import { ObjectIDToNameHandler } from "../handler/ObjectIDToNameHandlerTS";
import { RunData } from "../models/Admin/RunData";

const ObjectIDToNameCache = ObjectIDToNameHandler.getCache()

export const populateUsernamesOnRuns = async (runs: RunData[]) => {
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    if (run.userID) runs[i].username = await ObjectIDToNameCache.getUsername(run.userID);
  }
};
