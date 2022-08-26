import { ObjectId } from "mongodb";

export function TryParseObjectID(stringID: string, name: string, location = "") {
  try {
    return new ObjectId(stringID);
  } catch (e) {
    throw `Threw on ${name} parsing in ${location}: ${stringID}`;
  }
}
