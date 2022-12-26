import { ResultCache } from "../helpers/ResultCache";
import { LoggerProvider } from "../LoggerTS";

const Logger = LoggerProvider.getInstance();

export class ResultCacheWrapper<T> {
  private resultCache: ResultCache<Promise<T>>;
  private name: string;

  constructor(options: { name: string }) {
    this.resultCache = new ResultCache();
    this.name = options.name;
  }

  protected getSize() {
    return this.resultCache.getCount();
  }

  protected itemIsSet(id: string) {
    return this.resultCache.isSetAndActive(id);
  }

  public async getOrFetchValue(params: {
    id: string;
    type?: string;
    fetchMethod: (id?: string) => Promise<T>;
    getTimeToCache: () => Promise<number> | number;
    logFormatter?: (result: T) => string;
    cacheTimeFuzzRatio?: number;
  }) {
    const startTime = new Date();

    const cacheResult = this.tryGetItemFromCache(params.id);
    if (cacheResult !== false) {
      const toReturn = await Promise.resolve(cacheResult);

      const toLog = {
        cacheMiss: false,
        id: params.id,
        type: params.type,
        startTime,
        value: "no formatter",
      };
      if (params.logFormatter) toLog.value = params.logFormatter(toReturn);

      this.logMessage(toLog);

      return toReturn;
    } else {
      try {
        const result = params.fetchMethod(params.id);
        this.resultCache.setItem(params.id, result, 10);

        let timeToCache = await params.getTimeToCache();
        if (params.cacheTimeFuzzRatio) {
          timeToCache = Math.round((1 - Math.random() * params.cacheTimeFuzzRatio) * timeToCache);
        }

        this.resultCache.setItem(params.id, result, timeToCache);

        const resolvedResult = await Promise.resolve(result);

        const toLog = {
          cacheMiss: true,
          id: params.id,
          startTime,
          type: params.type,
          value: "no formatter",
        };
        if (params.logFormatter) toLog.value = params.logFormatter(resolvedResult);

        this.logMessage(toLog);

        return resolvedResult;
      } catch (e) {
        Logger.logError(this.name, e as Error);
        return null;
      }
    }
  }

  private logMessage(params: {
    cacheMiss: boolean;
    id: string;
    startTime: Date;
    type: string;
    value: string;
  }) {
    const nameString = params.type ? `${this.name}/${params.type}` : this.name;
    const time = new Date().getTime() - params.startTime.getTime();
    Logger.logCacheResult(nameString, params.cacheMiss, params.id, params.value, time);
  }

  protected tryGetItemFromCache(id: string) {
    if (this.resultCache.isSetAndActive(id)) return this.resultCache.getValue(id);
    else return false;
  }

  protected unsetItem(id: string) {
    this.resultCache.expireValue(id);
  }

  protected unsetAll() {
    this.resultCache = new ResultCache();
  }

  protected getTimeToExpire(id: string) {
    if (this.resultCache.isSetAndActive(id)) {
      return this.resultCache.getTimeToExpire(id);
    }
    return 0;
  }
}
