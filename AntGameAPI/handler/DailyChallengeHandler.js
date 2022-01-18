const { getMostRecentDailyChallenge } = require("../dao/ChallengeDao");
const { ExpiringResult } = require("../helpers/ExpiringResult");
const Logger = require("../Logger");

class ActiveDailyChallengeHandler {
  constructor() {
    this.challengeId = new ExpiringResult();
    this.timeToCache = 3600; // 1 hour
  }

  async getActiveDailyChallenge() {
    if (this.challengeId.isActive()) {
      const result = this.challengeId.getValue();
      return result;
    } else {
      try {
        const value = (await getMostRecentDailyChallenge())._id;
        const expireAt = new Date();
        expireAt.setSeconds(expireAt.getSeconds() + this.timeToCache);
        this.challengeId = new ExpiringResult(expireAt, value);
        return value;
      } catch (e) {
        console.error(`unable to get daily challenge`, e);
        return null;
      }
    }
  }

  clearCache = () => {
    this.challengeId = new ExpiringResult();
  };
}
const SingletonInstance = new ActiveDailyChallengeHandler();
module.exports = SingletonInstance;