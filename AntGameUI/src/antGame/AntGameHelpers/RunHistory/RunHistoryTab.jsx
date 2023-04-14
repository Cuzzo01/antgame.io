import React, { useEffect, useState } from "react";
import { useCallback } from "react";

import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTab.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";

const RunHistoryTab = ({ challengeId, loadRunHandler, gameMode, disabled }) => {
  const oppositeGameMode = gameMode === "replay" ? "Challenge" : "Replay";

  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(null);
  const [apiPageIndex, setApiPageIndex] = useState(1);
  const [mobilePageIndex, setMobilePageIndex] = useState(1);
  const [allPreviousRuns, setAllPreviousRuns] = useState([]);
  const [numRunsLoaded, setNumRunsLoaded] = useState(0);
  const [mobileCurrentRuns, setMobileCurrentRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileNumberNeededPerPage, ] = useState(Math.floor((window.innerHeight - 230) / 62));

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

  const setSubsetForMobile = useCallback((mobilePage, runs) => {
    var start = (mobilePage - 1) * mobileNumberNeededPerPage;
    var end = start + mobileNumberNeededPerPage;
    var subsetForMobile = runs.slice(start, end);

    if (subsetForMobile.length < mobileNumberNeededPerPage) {
      var numExtraNeeded = mobileNumberNeededPerPage - subsetForMobile.length;
      for (var i = 0; i < numExtraNeeded; i++) {
        subsetForMobile.push(null);
      }
    }
    setMobileCurrentRuns([...subsetForMobile]);
  }, [mobileNumberNeededPerPage]);

  const goToMobilePage = useCallback(
    async (page, apiPage) => {
      var totalNumberNeeded = mobileNumberNeededPerPage * page;
      var haveEnough = totalNumberNeeded <= numRunsLoaded;

      var allRunsCopy = [...allPreviousRuns];
      if (!haveEnough) {
        allRunsCopy = [
          ...allRunsCopy,
          ...(await loadMoreRuns(totalNumberNeeded - numRunsLoaded, apiPage)),
        ];
      }

      setSubsetForMobile(page, allRunsCopy);
      setMobilePageIndex(page);
    },
    [mobileNumberNeededPerPage, numRunsLoaded, allPreviousRuns, setSubsetForMobile, loadMoreRuns]
  );

  const setInitialRuns = useCallback(async () => {
    const initialRuns = await loadMoreRuns(mobileNumberNeededPerPage, 1);
    setSubsetForMobile(1, initialRuns);
  }, [loadMoreRuns, mobileNumberNeededPerPage, setSubsetForMobile]);

  useEffect(() => {
    setInitialRuns().then(() => setLoading(false));
  }, [setInitialRuns]);

  const oppositeGameModeAllowed = () => {
    return !(!ChallengeHandler.config.active && oppositeGameMode === "Challenge");
  };

  const doneLoading = !loading && hasGrabbedAllValidPrevRuns !== null;
  const morePages = !hasGrabbedAllValidPrevRuns || (mobilePageIndex !== Math.ceil(numRunsLoaded / mobileNumberNeededPerPage))

  return (
    <div className={styles.container}>
      {doneLoading ? (
        <>
          <h2 className={styles.title}>Previous Run{allPreviousRuns.length > 1 && "s"}</h2>
          {oppositeGameModeAllowed() && (
            <a href={`/${oppositeGameMode.toLowerCase()}/${challengeId}`}>{oppositeGameMode}</a>
          )}
          <div className={styles.runsList}>
            {mobileCurrentRuns.map((value, index) => (
              <RunEntry
                run={value}
                key={index}
                disabled={disabled}
                loadRun={run => loadRunHandler(run)}
              />
            ))}
          </div>
          <div className={styles.pagingBar}>
        {mobilePageIndex !== 1 ? (
          <span className={styles.link} onClick={() => goToMobilePage(mobilePageIndex - 1, apiPageIndex)}>
            &lt;&lt;
          </span>
        ) : (
          <span>&nbsp;&nbsp;</span>
        )}
        <span> {mobilePageIndex} </span>
        {morePages ? (
          <span className={styles.link} onClick={() => goToMobilePage(mobilePageIndex + 1, apiPageIndex)}>
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
      <div className={styles.date}>{dateValue.toLocaleDateString()}</div>
      <div className={styles.score}>{run.score}</div>
      <div className={styles.time}>{dateValue.toLocaleTimeString()}</div>
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
