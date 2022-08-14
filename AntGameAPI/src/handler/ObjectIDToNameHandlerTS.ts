import { ResultCacheWrapper } from "./ResultCacheWrapperTS";

import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { FullChampionshipConfig } from "../models/FullChampionshipConfig";

const { getChallengeByChallengeId } = require("../dao/ChallengeDao");
const { getChampionshipDetailsFromDB } = require("../dao/ChampionshipDao");
const { getUsernameByID } = require("../dao/UserDao");

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

  get timeToCache() {
    return Math.round(43200 * (1 - Math.random() * 0.1));
  }

  async getChallengeName(id: string): Promise<string> {
    return await this.getOrFetchValue({
      id,
      type: "Challenge",
      getTimeToCache: () => this.timeToCache,
      fetchMethod: async () => {
        const config = (await getChallengeByChallengeId(id)) as FullChallengeConfig;
        return config.name;
      },
    });
  }

  async getUsername(id): Promise<string> {
    return await this.getOrFetchValue({
      id,
      type: "Username",
      getTimeToCache: () => this.timeToCache,
      fetchMethod: async () => {
        return (await getUsernameByID(id)) as string;
      },
    });
  }

  async getChampionshipName(id): Promise<string> {
    return await this.getOrFetchValue({
      id,
      type: "Championship",
      getTimeToCache: () => this.timeToCache,
      fetchMethod: async () => {
        const championship = (await getChampionshipDetailsFromDB(id)) as FullChampionshipConfig;
        return championship.name;
      },
    });
  }
}
