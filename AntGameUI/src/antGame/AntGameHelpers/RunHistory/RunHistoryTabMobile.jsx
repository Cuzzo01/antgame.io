import React, { useEffect, useState } from "react";
import { useCallback } from "react";

import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTab.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";

const RunHistoryTabMobile = ({ challengeId, loadRunHandler, gameMode, disabled }) => {
  const oppositeGameMode = gameMode === "replay" ? "Challenge" : "Replay";

  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(null);
  const [apiPageIndex, setApiPageIndex] = useState(1);
  const [mobilePageIndex, setMobilePageIndex] = useState(1);
  const [allPreviousRuns, setAllPreviousRuns] = useState([]);
  const [lastPage, setLastPage] = useState(null);
  const [numRunsLoaded, setNumRunsLoaded] = useState(0);
  const [mobileCurrentRuns, setMobileCurrentRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  // const setMobileRuns = useCallback(async () => {
  //   console.log("set mobile, page", mobilePageIndex);
  //   var mobileNumber = Math.floor((window.innerHeight - 190) / 65);
  //   console.log(mobileNumber);

  //   var neededTotalRuns = mobileNumber * mobilePageIndex;
  //   var extraRunsNeeded = neededTotalRuns - numRunsLoaded;

  //   if (extraRunsNeeded > 0) {
  //     setApiPageIndex(prev => prev + 1);
  //     console.log("not enough");
  //   } else {
  //     console.log("enough");
  //     var subsetForMobile = allPreviousRuns.slice(
  //       (mobilePageIndex - 1) * mobileNumber,
  //       mobilePageIndex * mobileNumber
  //     )

  //     setMobileCurrentRuns([
  //       ...subsetForMobile
  //     ]);
  //     setLoading(false);
  //     return subsetForMobile;
  //   }
  // }, [mobilePageIndex, allPreviousRuns, numRunsLoaded]);

  const loadMoreRuns = useCallback(async (numToLoad, startingPage) => {
    var runsLoaded = 0;
    var hasLoadedAllRuns = false;

    var additionalRuns = [];
    var apiPage = startingPage;
    while (runsLoaded < numToLoad && !hasLoadedAllRuns) {
      var result = await getPreviousRunData({
        challengeId,
        pageIndex: apiPage,
      });
      console.log("runs back");
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
  }, [challengeId]);

  const goToMobilePage = useCallback(async (page, apiPage) => {
    var mobileNumberNeededPerPage = Math.floor((window.innerHeight - 190) / 65);
    var totalNumberNeeded = mobileNumberNeededPerPage * page;
    var haveEnough = totalNumberNeeded <= numRunsLoaded;

    var allRunsCopy = [...allPreviousRuns];
    if(!haveEnough) {
      allRunsCopy = [...allRunsCopy, ...(await loadMoreRuns(totalNumberNeeded - numRunsLoaded, apiPage))];
    } 

    var subsetForMobile = allRunsCopy.slice(
        (page - 1) * mobileNumberNeededPerPage,
        page * mobileNumberNeededPerPage
      )

      if(subsetForMobile.length < mobileNumberNeededPerPage) {
        setLastPage(page);
      }
      setMobileCurrentRuns([
        ...subsetForMobile
      ]);
    console.log('mobile page', page);
    setMobilePageIndex(page);
  }, [numRunsLoaded, allPreviousRuns, loadMoreRuns]);

  const setInitialRuns = useCallback(async () => {
    console.log("in init runs");
    const initialRuns = [];

    var mobileNumberNeeded = Math.floor((window.innerHeight - 190) / 65);
    var runsLoaded = 0;
    var hasLoadedAllRuns = false;
    var apiPage = 1;
    while (runsLoaded < mobileNumberNeeded && !hasLoadedAllRuns) {
      var result = await getPreviousRunData({
        challengeId,
        pageIndex: apiPage,
      });
      console.log("runs back");
      apiPage++;
      if (result) {
        initialRuns.push(...result.runs);
        runsLoaded += result.runs.length;
        hasLoadedAllRuns = result.reachedEndOfBatch;
      } else {
        hasLoadedAllRuns = true;
      }
    }
    setAllPreviousRuns(initialRuns);
    setNumRunsLoaded(runsLoaded);
    setHasGrabbedAllValidPrevRuns(hasLoadedAllRuns);
    setApiPageIndex(apiPage);

    var subsetForMobile = initialRuns.slice(0, mobileNumberNeeded);

    if(subsetForMobile.length < mobileNumberNeeded) {
      setLastPage(1);
    }
    setMobileCurrentRuns([...subsetForMobile]);
    console.log(initialRuns);
    console.log(subsetForMobile);
  }, [challengeId]);

  useEffect(() => {
    setInitialRuns().then(() => setLoading(false));
  }, [setInitialRuns]);

  const oppositeGameModeAllowed = () => {
    return !(!ChallengeHandler.config.active && oppositeGameMode === "Challenge");
  };

  const doneLoading = !loading && hasGrabbedAllValidPrevRuns !== null;

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
                <div>

                {mobilePageIndex !== 1 ? (
                  <div
                  className={styles.loadMore}
                  onClick={() => goToMobilePage(mobilePageIndex - 1, apiPageIndex)}
                  >
                    {"<<"} Prev
                  </div>
                ) : (
                  <></>
                  )}
                {(!hasGrabbedAllValidPrevRuns || (lastPage !== null && mobilePageIndex !== lastPage)) ? (
                  <div
                    className={styles.loadMore}
                    onClick={() => goToMobilePage(mobilePageIndex + 1, apiPageIndex)}
                    >
                    Next {">>"}
                  </div>
                ) : (
                  <></>
                  )}
                  </div>
              </div>
              <div className={styles.bottombar} />
        </>
      ) : (
        <div className={styles.loading}>Loading...</div>
      )}
    </div>
  );
};

const RunEntry = ({ run, disabled, loadRun }) => {
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

export default RunHistoryTabMobile;
