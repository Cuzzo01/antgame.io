const { ResultCache } = require("../helpers/ResultCache");
const FlagHandler = require("../handler/FlagHandler");
const { saveSeed, getSeedData, deleteSeed } = require("../dao/SeedDao");

class SeedBroker {
  constructor() {
    this.seedCache = new ResultCache();
  }

  async getSeed({ homeLocations, userID }) {
    const ttlHours = await FlagHandler.getFlagValue("seed-time-to-live-hours");
    const ttlSec = ttlHours * 60 * 60;
    const expiresAt = new Date();
    expiresAt.setHours(new Date().getHours() + ttlHours);
    let result = false;
    let seed;
    while (result === false) {
      seed = Math.round(Math.random() * 1e8);
      result = await saveSeed({ seed, userID, homeLocations, expiresAt });
    }
    this.seedCache.setItem(seed, { homeLocations, userID }, ttlSec);
    return seed;
  }

  async checkSeed({ homeLocations, userID, seed }) {
    let seedData = false;
    if (this.seedCache.isSetAndActive(seed)) seedData = this.seedCache.getValue(seed);
    else {
      const dbResult = await getSeedData({ seed });
      if (dbResult !== null) {
        if (dbResult.expiresAt.getTime() < new Date().getTime())
          return { isValid: false, message: "seed expired" };
        seedData = dbResult;
      }
    }

    if (seedData === false) return { isValid: false, message: "couldn't find seed" };
    if (userID !== seedData.userID) return { isValid: false, message: "non-matching userID" };
    if (homeLocations.length !== seedData.homeLocations.length)
      return { isValid: false, message: "home count mismatch" };
    for (const index in homeLocations) {
      const givenPoint = homeLocations[index];
      const recordedPoint = seedData.homeLocations[index];

      if (givenPoint[0] !== recordedPoint[0]) return { isValid: false, message: "point mismatch" };
      if (givenPoint[1] !== recordedPoint[1]) return { isValid: false, message: "point mismatch" };
    }

    await deleteSeed({ seed });
    return { isValid: true };
  }
}
const SingletonInstance = new SeedBroker();
module.exports = { SeedBroker: SingletonInstance };
