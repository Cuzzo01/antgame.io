import ExpiringResult from "./ExpiringResult";

class ResultCache {
  constructor() {
    this.cache = {};
  }

  getValue(name) {
    const eResult = this.cache[name];
    if (eResult) return eResult.getValue();
    throw "getValue called on unset name";
  }

  setItem(name, value, timeToCache_sec) {
    let expireAt = new Date();
    expireAt.setSeconds(expireAt.getSeconds() + timeToCache_sec);
    this.cache[name] = new ExpiringResult(expireAt, value);
  }

  isSetAndActive(name) {
    const eResult = this.cache[name];
    if (eResult) return eResult.isActive();
    return false;
  }

  expireValue(name) {
    this.cache[name] = null;
  }
}
export default ResultCache;
