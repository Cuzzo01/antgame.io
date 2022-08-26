import { getFlag } from "../dao/FlagDao";
import { ExpiringResult } from "../helpers/ExpiringResult";
import { ResultCache } from "../helpers/ResultCache";
import { LoggerProvider } from "../LoggerTS";
import { FlagData } from "../models/FlagData";

const Logger = LoggerProvider.getInstance();

export class FlagHandler {
  private static cache: FlagCache;

  static getCache() {
    if (this.cache) return this.cache;
    this.cache = new FlagCache();
    return this.cache;
  }
}

export class FlagCache {
  private resultCache: ResultCache<Promise<FlagData>>;
  private timeToCache: ExpiringResult<Promise<number>>;

  constructor() {
    this.resultCache = new ResultCache();
  }

  getFlagTTL(name: string) {
    if (this.resultCache.isSetAndActive(name)) return this.resultCache.getTimeToExpire(name);
    else return false;
  }

  async getFlagValue(name: string) {
    const startTime = new Date();
    if (!this.timeToCache || !this.timeToCache.isActive()) await this.refreshTimeToCache();
    const timeToCache = await Promise.resolve(this.timeToCache.getValue());

    if (this.resultCache.isSetAndActive(name)) {
      const data = await Promise.resolve(this.resultCache.getValue(name));
      Logger.logCacheResult(
        "FlagHandler",
        false,
        name,
        JSON.stringify(data),
        new Date().getTime() - startTime.getTime()
      );
      if (data !== null) return data.value;
      return null;
    } else {
      let data: Promise<FlagData>;
      try {
        data = getFlag(name);
      } catch (e) {
        data = null;
      }
      this.resultCache.setItem(name, data, timeToCache);
      const resolvedData = await Promise.resolve(data);

      Logger.logCacheResult(
        "FlagHandler",
        true,
        name,
        JSON.stringify(resolvedData),
        new Date().getTime() - startTime.getTime()
      );
      return resolvedData.value;
    }
  }

  async getIntFlag(name: string) {
    return parseInt(await this.getFlagValue(name));
  }

  async getBoolFlag(name: string) {
    const value = await this.getFlagValue(name);
    if (typeof value === "boolean") return value;
    return value === "true";
  }

  async getFlagData(name: string) {
    if (!this.resultCache.isSetAndActive(name)) await this.getFlagValue(name);

    const flagData = await Promise.resolve(this.resultCache.getValue(name));
    return {
      value: flagData.value,
      bypassCache: flagData.bypassCache,
    };
  }

  async refreshTimeToCache() {
    const timeToCache = getFlag("timeToCacheFlags") as Promise<FlagData>;
    const thirtySeconds = new Date();
    thirtySeconds.setSeconds(thirtySeconds.getSeconds() + 30);
    this.timeToCache = new ExpiringResult(
      thirtySeconds,
      Promise.resolve(timeToCache.then(data => parseInt(data.value)))
    );

    const result = parseInt((await timeToCache).value);
    const expireAt = new Date();
    expireAt.setSeconds(expireAt.getSeconds() + result);
    this.timeToCache = new ExpiringResult(expireAt, Promise.resolve(result));
    return;
  }

  unsetAll() {
    this.resultCache = new ResultCache();
  }
}
