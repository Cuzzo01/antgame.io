const { getUserBadgesByID, getUserDetailsByID } = require("../dao/UserDao");
const { getJoinedString } = require("../helpers/TimeHelper");
const FlagHandler = require("./FlagHandler");
const { ResultCacheWrapper } = require("./ResultCacheWrapper");

class UserHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "UserHandler" });
  }

  async getBadges(id) {
    return await this.getOrFetchValue({
      id,
      type: "Badges",
      fetchMethod: async id => {
        const badges = await getUserBadgesByID(id);
        badges.sort((a, b) => (a.value < b.value ? 1 : -1));
        return badges.slice(0, 5).map(badge => {
          return {
            name: badge.name,
            color: badge.color,
            icon: badge.icon,
            backgroundColor: badge.backgroundColor,
          };
        });
      },
      getTimeToCache: async () => {
        const maxTimeToCache = await FlagHandler.getFlagValue("time-to-cache-badges-internal");
        const cacheTime = Math.round(maxTimeToCache * (1 - Math.random() * 0.2));
        return cacheTime;
      },
      logFormatter: () => "",
    });
  }

  async getUserDetails(id) {
    return await this.getOrFetchValue({
      id: `${id}-details`,
      type: "Badges",
      fetchMethod: async () => {
        const result = {};
        result.badges = await getUserBadgesByID(id);
        result.badges.sort((a, b) => (a.value < b.value ? 1 : -1));

        const details = await getUserDetailsByID(id);
        result.name = details.username;
        if (details.joinDate) result.joined = getJoinedString(details.joinDate);
        else result.joined = "Long ago";

        return result;
      },
      getTimeToCache: async () => {
        const maxTimeToCache = await FlagHandler.getFlagValue("time-to-cache-user-details");
        const cacheTime = Math.round(maxTimeToCache * (1 - Math.random() * 0.2));
        return cacheTime;
      },
      logFormatter: () => "",
    });
  }

  getBadgeTTL(id) {
    return this.getTimeToExpire(id);
  }

  getDetailsTTL(id) {
    return this.getTimeToExpire(`${id}-details`);
  }
}
const SingletonInstance = new UserHandler();
module.exports = SingletonInstance;
