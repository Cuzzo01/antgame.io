import ResultCache from "../Helpers/ResultCache";
import { GetUserBadges } from "./UserService";

class BadgeService {
  constructor() {
    this.badgesToFetch = [];
    this.fetchingBadge = false;
    this.badgesCache = new ResultCache();
    this.timeToCache = 600; // 10 min
  }

  async getBadges(userID) {
    if (this.badgesCache.isSetAndActive(userID)) {
      return await Promise.resolve(this.badgesCache.getValue(userID).badgePromise);
    } else {
      let resolveFunc;
      const badgePromise = new Promise(resolve => {
        resolveFunc = resolve;
      });
      this.badgesCache.setItem(userID, { badgePromise, resolveFunc }, this.timeToCache);
      this.badgesToFetch.push(userID);
      this.getNextBadge();
      return badgePromise;
    }
  }

  async getNextBadge() {
    if (this.badgesToFetch.length > 0 && !this.fetchingBadge) {
      this.fetchingBadge = true;

      const userID = this.badgesToFetch.shift();
      const badges = await GetUserBadges(userID);
      const resolveFunction = this.badgesCache.getValue(userID).resolveFunc;
      resolveFunction(badges);

      this.fetchingBadge = false;
      this.getNextBadge();
    }
  }
}
const SingletonInstance = new BadgeService();
export default SingletonInstance;
