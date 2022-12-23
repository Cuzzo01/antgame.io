import { ResultCacheWrapper } from "./ResultCacheWrapper";

import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { FullChampionshipConfig } from "../models/FullChampionshipConfig";
import { getChallengeByChallengeId } from "../dao/ChallengeDao";
import { getChampionshipDetailsFromDB } from "../dao/ChampionshipDao";
import { ObjectId } from "mongodb";
import { UserDao } from "../dao/UserDao";

export class ObjectIDToNameHandler {
  private static cache: ObjectIDtoNameCache;

  static getCache(): ObjectIDtoNameCache {
    if (this.cache) return this.cache;
    this.cache = new ObjectIDtoNameCache();
    return this.cache;
  }
}

class ObjectIDtoNameCache extends ResultCacheWrapper<string> {
  private _userDao: UserDao;

  constructor() {
    super({ name: "ObjectIDToNameHandler" });
    this._userDao = new UserDao();
  }

  get size() {
    return super.getSize();
  }

  async getChallengeName(id: ObjectId | string): Promise<string> {
    return await this.getOrFetchValue({
      id: id.toString(),
      type: "Challenge",
      getTimeToCache: () => 43200,
      cacheTimeFuzzRatio: 0.1,
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
      getTimeToCache: () => 43200,
      cacheTimeFuzzRatio: 0.1,
      fetchMethod: async () => {
        return await this._userDao.getUsernameById(id);
      },
      logFormatter: result => result,
    });
  }

  async getChampionshipName(id: ObjectId | string): Promise<string> {
    return await this.getOrFetchValue({
      id: id.toString(),
      type: "Championship",
      getTimeToCache: () => 43200,
      cacheTimeFuzzRatio: 0.1,
      fetchMethod: async () => {
        const championship = (await getChampionshipDetailsFromDB(id)) as FullChampionshipConfig;
        return championship.name;
      },
      logFormatter: result => result,
    });
  }
}
