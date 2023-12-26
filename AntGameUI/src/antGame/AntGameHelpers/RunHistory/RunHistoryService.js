import { getPreviousRunData } from "../../Challenge/ChallengeService";
import EventBus from "../../Helpers/EventBus";

export class RunHistoryService {
  constructor(challengeId) {
    this._challengeId = challengeId;
    this._allRuns = [];
    this._hasLoadedAllRuns = false;
    this._apiPage = 1;
  }

  async loadMoreRuns() {
    var result = await getPreviousRunData({
      challengeId: this._challengeId,
      pageIndex: this._apiPage,
    });
    this._apiPage++;
    if (result) {
      this._allRuns.push(...result.runs);
      this._hasLoadedAllRuns = result.reachedEndOfBatch;
    } else {
      this._hasLoadedAllRuns = true;
    }
  }

  async getRunsBetween(start, end) {
    while (!this._hasLoadedAllRuns && this._allRuns.length < end) {
      await this.loadMoreRuns();
    }

    var runsToSend = this._allRuns
      .map((run, index) => {
        return { ...run, index: index + 1 };
      })
      .slice(start, end);
    return {
      runs: runsToSend,
      endReached: this._hasLoadedAllRuns,
      numLoaded: this._allRuns.length,
    };
  }

  pushNewestRunToTop(artifact, response) {
    var newRun = {
      locations: artifact.HomeLocations,
      amounts: JSON.parse(artifact.Snapshots?.finish[5]),
      seed: artifact.GameConfig.seed,
      compatibilityDate: artifact.GameConfig.compatibilityDate,
      submissionTime: artifact.Timing.SystemStopTime,
      score: artifact.Score,
      pr: artifact.PB,
      wr: response.isWrRun,
    };

    this._allRuns = [newRun, ...this._allRuns];

    EventBus.dispatch("runHistoryUpdated", {});
  }

  registerRunSubmittedListener() {
    this._runAcceptedListenerId = EventBus.on("runAccepted", data =>
      this.pushNewestRunToTop(data.artifact, data.response)
    );
  }

  removeRunSubmittedListener() {
    EventBus.remove("runAccepted", this._runAcceptedListenerId);
  }
}
