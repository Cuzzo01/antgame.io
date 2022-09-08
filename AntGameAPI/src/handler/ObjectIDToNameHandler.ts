import { ResultCacheWrapper } from "./ResultCacheWrapper";

import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { FullChampionshipConfig } from "../models/FullChampionshipConfig";
import { getChallengeByChallengeId } from "../dao/ChallengeDao";
import { getUsernameByID } from "../dao/UserDao";
import { getChampionshipDetailsFromDB } from "../dao/ChampionshipDao";
import { ObjectId } from "mongodb";

export class ObjectIDToNameHandler {
  private static cache: ObjectIDtoNameCache;

  static getCache(): ObjectIDtoNameCache {
    if (this.cache) return this.cache;
    this.cache = new ObjectIDtoNameCache();
    return this.cache;
  }
}

class ObjectIDtoNameCache extends ResultCacheWrapper<string> {
  constructor() {
    super({ name: "ObjectIDToNameHandler" });
  }

  get size() {
    return super.getSize();
  }

  get timeToCache() {
    return Math.round(43200 * (1 - Math.random() * 0.1));
  }

  async getChallengeName(id: ObjectId | string): Promise<string> {
    return await this.getOrFetchValue({
      id: id.toString(),
      type: "Challenge",
      getTimeToCache: () => this.timeToCache,
      fetchMethod: async () => {
        const config = (await getChallengeByChallengeId(id)) as FullChallengeConfig;
        return config.name;
      },
      logFormatter: result => result,
    });
  }

  async getUsername(id: ObjectId | string): Promise<string> {
    return await this.getOrFetchValue({
      id: id.toString(),
      type: "Username",
      getTimeToCache: () => this.timeToCache,
      fetchMethod: async () => {
        return (await getUsernameByID(id)) as string;
      },
      logFormatter: result => result,
    });
  }

  async getChampionshipName(id: ObjectId | string): Promise<string> {
    return await this.getOrFetchValue({
      id: id.toString(),
      type: "Championship",
      getTimeToCache: () => this.timeToCache,
      fetchMethod: async () => {
        const championship = (await getChampionshipDetailsFromDB(id)) as FullChampionshipConfig;
        return championship.name;
      },
      logFormatter: result => result,
    });
  }
}
