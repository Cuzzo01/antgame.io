class ExpiringResult {
  constructor(expireAt, value) {
    this.expireAt = expireAt;
    this.value = value;
  }

  get timeBeforeExpires() {
    return Math.round((this.expireAt.getTime() - new Date().getTime()) / 1000);
  }

  getValue = () => {
    if (this.isActive()) {
      return this.value;
    } else throw "getValue called on expired result";
  };

  isActive = () => {
    if (this.expireAt > new Date()) return true;
    else {
      this.value = [null, null];
      return false;
    }
  };
}
module.exports = { ExpiringResult };
