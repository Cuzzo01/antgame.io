import { ExpiringResult } from "./ExpiringResult";

interface Cache<T> {
  [key: string]: ExpiringResult<T>;
}

export class ResultCache<T> {
  private cache: Cache<T> = {};

  getCount() {
    return Object.keys(this.cache).length;
  }

  getValue(name: string) {
    const eResult = this.cache[name];
    if (eResult) return eResult.getValue();
    throw "getValue called on unset name";
  }

  setItem(name: string, value: T, timeToCache_sec: number) {
    const expireAt = new Date();
    expireAt.setSeconds(expireAt.getSeconds() + timeToCache_sec);
    this.cache[name] = new ExpiringResult(expireAt, value);
  }

  isSetAndActive(name: string) {
    const eResult = this.cache[name];
    if (eResult) return eResult.isActive();
    return false;
  }

  expireValue(name: string) {
    this.cache[name] = null;
  }

  getTimeToExpire(name: string) {
    return this.cache[name].timeBeforeExpires;
  }
}
