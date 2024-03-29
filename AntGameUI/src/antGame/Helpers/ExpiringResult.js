class ExpiringResult {
  constructor(expireAt, value) {
    this.expireAt = expireAt;
    this.value = value;
  }

  getValue = () => {
    if (this.value !== [null, null] && this.isActive()) {
      return this.value;
    } else throw new Error("getValue called on expired result");
  };

  isActive = () => {
    if (this.expireAt > new Date()) return true;
    else {
      this.value = [null, null];
      return false;
    }
  };
}
export default ExpiringResult;
