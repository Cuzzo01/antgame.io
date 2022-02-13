import ResultCache from "../Helpers/ResultCache";
import { GetUserBadges } from "./UserService";

class BadgeService {
  constructor() {
    this.badgesCache = new ResultCache();
    this.timeToCache = 600; // 10 min
  }

  async getBadges(id) {
    if (this.badgesCache.isSetAndActive(id)) {
      return await Promise.resolve(this.badgesCache.getValue(id));
    } else {
      this.badgesCache.setItem(id, GetUserBadges(id), this.timeToCache);
    }
  }
}
const SingletonInstance = new BadgeService();
export default SingletonInstance;
