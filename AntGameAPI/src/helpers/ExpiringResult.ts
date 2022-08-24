export class ExpiringResult<T> {
  private expireAt: Date;
  private value: T;

  constructor(expireAt: Date, value: T) {
    if (typeof expireAt === "number") this.expireAt = new Date(expireAt);
    else this.expireAt = expireAt;

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
    return this.expireAt > new Date();
  };
}
