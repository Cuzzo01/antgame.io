import React, { useEffect, useState } from "react";
import { useCallback } from "react";

import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTab.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";

const RunHistoryTab = ({ challengeId, loadRunHandler, gameMode, disabled }) => {
  const oppositeGameMode = gameMode === "replay" ? "Challenge" : "Replay";

  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(null);
  const [apiPageIndex, setApiPageIndex] = useState(1);
  const [runsListPageIndex, setPageIndex] = useState(1);
  const [allPreviousRuns, setAllPreviousRuns] = useState([]);
  const [numRunsLoaded, setNumRunsLoaded] = useState(0);
  const [currentRunsDisplaying, setCurrentRunsDisplaying] = useState([]);
  const [loading, setLoading] = useState(true);
  const [numberNeededPerPage] = useState(Math.floor((window.innerHeight - 230) / 63));

  const loadMoreRuns = useCallback(
    async (numToLoad, startingPage) => {
      var runsLoaded = 0;
      var hasLoadedAllRuns = false;

      var additionalRuns = [];
      var apiPage = startingPage;
      while (runsLoaded < numToLoad && !hasLoadedAllRuns) {
        var result = await getPreviousRunData({
          challengeId,
          pageIndex: apiPage,
        });
        apiPage++;
        if (result) {
          additionalRuns.push(...result.runs);
          runsLoaded += result.runs.length;
          hasLoadedAllRuns = result.reachedEndOfBatch;
        } else {
          hasLoadedAllRuns = true;
        }
      }
      setAllPreviousRuns(prev => [...prev, ...additionalRuns]);
      setNumRunsLoaded(prev => prev + runsLoaded);
      setHasGrabbedAllValidPrevRuns(hasLoadedAllRuns);
      setApiPageIndex(apiPage);
      return additionalRuns;
    },
    [challengeId]
  );

  const setSubsetToDisplay = useCallback(
    (page, runs) => {
      var start = (page - 1) * numberNeededPerPage;
      var end = start + numberNeededPerPage;
      var subsetToDisplay = runs.slice(start, end);

      if (subsetToDisplay.length < numberNeededPerPage) {
        var numExtraNeeded = numberNeededPerPage - subsetToDisplay.length;
        for (var i = 0; i < numExtraNeeded; i++) {
          subsetToDisplay.push(null);
        }
      }
      setCurrentRunsDisplaying([...subsetToDisplay]);
    },
    [numberNeededPerPage]
  );

  const goToPage = useCallback(
    async (page, apiPage) => {
      var totalNumberNeeded = numberNeededPerPage * page;
      var haveEnough = totalNumberNeeded <= numRunsLoaded;

      var allRunsCopy = [...allPreviousRuns];
      if (!haveEnough) {
        allRunsCopy = [
          ...allRunsCopy,
          ...(await loadMoreRuns(totalNumberNeeded - numRunsLoaded, apiPage)),
        ];
      }

      setSubsetToDisplay(page, allRunsCopy);
      setPageIndex(page);
    },
    [numberNeededPerPage, numRunsLoaded, allPreviousRuns, setSubsetToDisplay, loadMoreRuns]
  );

  const setInitialRuns = useCallback(async () => {
    const initialRuns = await loadMoreRuns(numberNeededPerPage, 1);
    setSubsetToDisplay(1, initialRuns);
  }, [loadMoreRuns, numberNeededPerPage, setSubsetToDisplay]);

  useEffect(() => {
    setInitialRuns().then(() => setLoading(false));
  }, [setInitialRuns]);

  const oppositeGameModeAllowed = () => {
    return !(!ChallengeHandler.config.active && oppositeGameMode === "Challenge");
  };

  const doneLoading = !loading && hasGrabbedAllValidPrevRuns !== null;
  const morePages =
    !hasGrabbedAllValidPrevRuns ||
    runsListPageIndex !== Math.ceil(numRunsLoaded / numberNeededPerPage);

  return (
    <div className={styles.container}>
      {doneLoading ? (
        <>
          <h2 className={styles.title}>Previous Run{allPreviousRuns.length > 1 && "s"}</h2>
          {oppositeGameModeAllowed() ? (
            <a href={`/${oppositeGameMode.toLowerCase()}/${challengeId}`}>{oppositeGameMode}</a>
          ) : (<span />)}
          <div className={styles.runsList}>
            {currentRunsDisplaying.map((value, index) => (
              <RunEntry
                run={value}
                key={index}
                disabled={disabled}
                loadRun={run => loadRunHandler(run)}
              />
            ))}
          </div>
          <div className={styles.pagingBar}>
            {runsListPageIndex !== 1 ? (
              <span
                className={styles.link}
                onClick={() => goToPage(runsListPageIndex - 1, apiPageIndex)}
              >
                &lt;&lt;
              </span>
            ) : (
              <span>&nbsp;&nbsp;</span>
            )}
            <span> {runsListPageIndex} </span>
            {morePages ? (
              <span
                className={styles.link}
                onClick={() => goToPage(runsListPageIndex + 1, apiPageIndex)}
              >
                &gt;&gt;
              </span>
            ) : (
              <span>&nbsp;&nbsp;</span>
            )}
          </div>
        </>
      ) : (
        <div className={styles.loading}>Loading...</div>
      )}
    </div>
  );
};

const RunEntry = ({ run, disabled, loadRun }) => {
  if (!run) {
    return <div className={styles.runEntryRowEmpty}></div>;
  }
  const dateValue = new Date(run.submissionTime);

  let style = styles.runEntryRow;
  let action = () => loadRun(run);

  if (disabled) {
    style = styles.runEntryRowDisabled;
    action = null;
  }

  return (
    <div className={style} onClick={action}>
      <span className={styles.date}>{dateValue.toLocaleDateString()}</span>
      <span className={styles.score}>{run.score}</span>
      <span className={styles.time}>{dateValue.toLocaleTimeString()}</span>
      {(run.pr || run.wr) && (
        <div className={styles.tags}>
          {run.pr && <span className={styles.prText}>PR</span>}
          {run.wr && <span className={styles.wrText}>WR</span>}
        </div>
      )}
    </div>
  );
};

export default RunHistoryTab;
