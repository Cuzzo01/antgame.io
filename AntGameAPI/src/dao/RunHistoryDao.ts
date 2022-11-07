import { Collection } from "mongodb";
import { TryParseObjectID } from "./helpers";
import { MongoConnection } from "./MongoClientTS";
import { RunEntityProjection } from "./entities/RunEntityProjection";

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
              finalSnapshot: {
                $arrayElemAt: ["$details.snapshots", -1],
              },
              seed: 1,
              compatibilityDate: 1,
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

    return (
      result?.map(runData => {
        return {
          locations: runData.details.homeLocations,
          amounts: runData.details.finalSnapshot?.at(5),
          seed: runData.details.seed,
          compatibilityDate: runData.details.compatibilityDate ?? null,
          submissionTime: runData.submissionTime,
          score: runData.score,
          pr: runData.tagTypes?.includes("pr") ?? false,
          wr: runData.tagTypes?.includes("wr") ?? false,
        };
      }) ?? []
    );
  }
}
