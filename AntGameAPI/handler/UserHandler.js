const { getUserBadgesByID } = require("../dao/UserDao");
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
}
const SingletonInstance = new UserHandler();
module.exports = SingletonInstance;
