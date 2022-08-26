import { TryParseObjectID } from "../dao/helpers";
import { deleteSeed, getOutstandingSeedCount, getSeedData, saveSeed } from "../dao/SeedDao";
import { FlagHandler } from "../handler/FlagHandler";
import { ResultCache } from "../helpers/ResultCache";
import { SeedData } from "../models/SeedData";

const FlagCache = FlagHandler.getCache();

export class SeedBrokerProvider {
  private static broker: SeedBroker;

  static getBroker(): SeedBroker {
    if (this.broker) return this.broker;
    this.broker = new SeedBroker();
    return this.broker;
  }
}

class SeedBroker {
  private seedCache: ResultCache<SeedData>;

  constructor() {
    this.seedCache = new ResultCache();
  }

  async getSeed(params: { homeLocations: number[][]; userID: string }) {
    const outstandingSeeds = (await getOutstandingSeedCount({ userID: params.userID })) as number;
    const outstandingSeedLimit = await FlagCache.getIntFlag("maximum-outstanding-seeds");
    if (outstandingSeeds >= outstandingSeedLimit) {
      return { success: false };
    }

    const ttlHours = await FlagCache.getIntFlag("seed-time-to-live-hours");
    const ttlSec = ttlHours * 60 * 60;
    const expiresAt = new Date();
    expiresAt.setHours(new Date().getHours() + ttlHours);
    let result = false;
    let seed: number;
    while (result === false) {
      seed = Math.round(Math.random() * 1e8);
      result = await saveSeed({
        seed,
        userID: params.userID,
        homeLocations: params.homeLocations,
        expiresAt,
      });
    }
    const userObjectID = TryParseObjectID(params.userID, "UserID", "SeedBroker");
    this.seedCache.setItem(
      seed.toString(),
      {
        homeLocations: params.homeLocations,
        userID: userObjectID,
        createdAt: new Date().getTime(),
      },
      ttlSec
    );
    return { seed, success: true };
  }

  async checkSeed(params: {
    homeLocations: number[][];
    userID: string;
    seed: number;
    minAgeSeconds: number;
  }) {
    let seedData: SeedData | false = false;
    if (this.seedCache.isSetAndActive(params.seed.toString()))
      seedData = this.seedCache.getValue(params.seed.toString());
    else {
      const dbResult = (await getSeedData({ seed: params.seed })) as SeedData | null;
      if (dbResult !== null) {
        if (dbResult.expiresAt.getTime() < new Date().getTime())
          return { isValid: false, message: "seed expired" };
        seedData = dbResult;
      }
    }

    if (seedData === false) return { isValid: false, message: "couldn't find seed" };

    const seedUser = seedData.userID;
    if (!seedUser.equals(params.userID)) return { isValid: false, message: "non-matching userID" };

    let createTime: number;
    if (seedData._id) {
      createTime = new Date(seedData._id.getTimestamp()).getTime();
    } else if (seedData.createdAt) {
      createTime = seedData.createdAt;
    }
    const age = Math.round((new Date().getTime() - createTime) / 1000);
    if (age < params.minAgeSeconds)
      return {
        isValid: false,
        message: "seed isn't old enough",
        seedCreateTime: new Date(createTime),
      };

    if (params.homeLocations.length !== seedData.homeLocations.length)
      return { isValid: false, message: "home count mismatch" };
    for (const givenPoint of params.homeLocations) {
      const index = params.homeLocations.findIndex(point => point === givenPoint);
      const recordedPoint = seedData.homeLocations[index];

      if (givenPoint[0] !== recordedPoint[0]) return { isValid: false, message: "point mismatch" };
      if (givenPoint[1] !== recordedPoint[1]) return { isValid: false, message: "point mismatch" };
    }

    await deleteSeed({ seed: params.seed });
    this.seedCache.expireValue(params.seed.toString());
    return { isValid: true, seedCreateTime: new Date(createTime) };
  }
}
