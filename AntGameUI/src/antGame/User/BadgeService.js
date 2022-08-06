import ResultCache from "../Helpers/ResultCache";
import { GetBatchBadges, GetUserBadges } from "./UserService";
import AuthHandler from "../Auth/AuthHandler";

class BadgeService {
  constructor() {
    this.badgesToFetch = [];
    this.fetchingBadge = false;
    this.fetchTimeout = false;
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
      this.fetchBadges();
      return badgePromise;
    }
  }

  async fetchBadges() {
    if (!this.fetchingBadge && this.badgesToFetch.length > 0) {
      if (AuthHandler.loggedIn) {
        if (this.fetchTimeout) clearTimeout(this.fetchTimeout);
        this.fetchTimeout = setTimeout(this.getBatchBadges.bind(this), 10);
      } else {
        this.getSingleBadge();
      }
    }
  }

  async getSingleBadge() {
    this.fetchingBadge = true;

    const userID = this.badgesToFetch.shift();
    const badges = await GetUserBadges(userID);
    const resolveFunction = this.badgesCache.getValue(userID).resolveFunc;
    resolveFunction(badges);

    this.fetchingBadge = false;
    this.fetchBadges();
  }

  async getBatchBadges() {
    if (!AuthHandler.loggedIn || this.fetchingBadge)
      throw new Error("Illegal call to getBatchBadges");
    this.fetchingBadge = true;

    const userIDList = [...this.badgesToFetch];
    if (userIDList.length > 100) {
      userIDList.length = 100;
      this.badgesToFetch = this.badgesToFetch.slice(100);
    } else this.badgesToFetch.length = 0;

    const badgeResponse = await GetBatchBadges(userIDList);
    this.badgesToFetch.length = 0;

    for (const [userID, badges] of Object.entries(badgeResponse)) {
      const resolveFunction = this.badgesCache.getValue(userID).resolveFunc;
      resolveFunction(badges);
    }
    this.fetchingBadge = false;
    this.fetchTimeout = false;
    this.fetchBadges();
  }
}
const SingletonInstance = new BadgeService();
export default SingletonInstance;
