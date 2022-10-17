import { Collection } from "mongodb";
import { TryParseObjectID } from "./helpers";
import { MongoConnection } from "./MongoClientTS";

interface RunEntityProjection {
  details: {
    homeLocations: number[][];
    seed: number;
    homeAmounts: {
      [location: string]: number;
    };
  };
  submissionTime: Date;
  score: number;
  tagTypes: string[];
}

export class RunHistoryDao {
  private _collection: Collection;

  private async getCollection() {
    if (!this._collection) {
      const connection = await MongoConnection.open();
      this._collection = connection.db("challenges").collection("runs");
    }
    return this._collection;
  }

  public async getRunsByUserIdAndChallengeId(
    userId: string,
    challengeId: string,
    page: number,
    pageLength: number
  ) {
    const challengeObjectID = TryParseObjectID(challengeId, "challengeID", "RunHistoryDao");
    const userObjectID = TryParseObjectID(userId, "userID", "RunHistoryDao");
    const recordsToSkip = pageLength * (page - 1);

    const collection = await this.getCollection();

    const result = (await collection
      .find(
        {
          userID: userObjectID,
          challengeID: challengeObjectID,
        },
        {
          projection: {
            details: {
              homeLocations: 1,
              homeAmounts: {
                $arrayElemAt: [{ $arrayElemAt: ["$details.snapshots", -1] }, 5],
              },
              seed: 1,
            },
            tagTypes: "$tags.type",
            score: 1,
            submissionTime: 1,
            _id: 0,
          },
        }
      )
      .sort({ submissionTime: -1 })
      .skip(recordsToSkip)
      .limit(pageLength)
      .toArray()) as unknown as RunEntityProjection[];

      if (!result) return [];

    const runs = result.map(runData => {
      return {
        locations: runData.details.homeLocations,
        amounts: runData.details.homeAmounts,
        seed: runData.details.seed,
        submissionTime: runData.submissionTime,
        score: runData.score,
        pr: runData.tagTypes?.includes("pr") ?? false,
      };
    });

    return runs;
  }
}
