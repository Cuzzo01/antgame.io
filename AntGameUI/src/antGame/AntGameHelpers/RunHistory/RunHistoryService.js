import { getPreviousRunData } from "../../Challenge/ChallengeService";

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
        while (!this._hasLoadedAllRuns && this._allRuns.length < end - 1) {
            await this.loadMoreRuns();
        }

        var runsToSend = this._allRuns.map((run, index) => { return { ...run, index: index + 1} }).slice(start, end);
        return { runs: runsToSend, endReached: this._hasLoadedAllRuns, numLoaded: this._allRuns.length };
    }
}
