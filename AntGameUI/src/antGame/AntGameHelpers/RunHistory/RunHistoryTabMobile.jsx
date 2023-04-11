import React, { useEffect, useState } from "react";
import { useCallback } from "react";

import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTabMobile.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";

const RunHistoryTabMobile = ({ challengeId, loadRunHandler, gameMode, disabled }) => {
  const oppositeGameMode = gameMode === "replay" ? "Challenge" : "Replay";

  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(null);
  const [apiPageIndex, setApiPageIndex] = useState(1);
  const [mobilePageIndex, setMobilePageIndex] = useState(1);
  const [allPreviousRuns, setAllPreviousRuns] = useState([]);
  const [lastPage, setLastPage] = useState(null);
  const [anotherPage, setAnotherPage] = useState(true);
  const [numRunsLoaded, setNumRunsLoaded] = useState(0);
  const [mobileCurrentRuns, setMobileCurrentRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkAnotherPage = useCallback((hasLoadedAllRuns) => {
    if(!hasLoadedAllRuns){
      console.log('havent grabbed all');
      return true;
    }
    var mobileNumberNeeded = Math.floor((window.innerHeight - 230) / 62);

    var lastMobilePageIndex = Math.ceil(numRunsLoaded / mobileNumberNeeded);
    console.log(mobileNumberNeeded, lastMobilePageIndex, mobilePageIndex, numRunsLoaded);

    setAnotherPage(mobilePageIndex === lastMobilePageIndex);
  }, [ mobilePageIndex, numRunsLoaded]);

  // const anotherPageExists = ({mobilePage, runsLoaded, hasLoadedAllRuns}) => {
  //   if(!hasLoadedAllRuns){
  //     console.log('havent grabbed all');
  //     return true;
  //   }
  //   var mobileNumberNeeded = Math.floor((window.innerHeight - 230) / 62);

  //   var lastMobilePageIndex = Math.ceil(runsLoaded / mobileNumberNeeded);
  //   console.log(mobileNumberNeeded, lastMobilePageIndex, mobilePage, numRunsLoaded);

  //   return (mobilePage === lastMobilePageIndex);
  // }
  
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
      checkAnotherPage(hasLoadedAllRuns);
      setApiPageIndex(apiPage);
      return additionalRuns;
    },
    [challengeId]
  );

  const goToMobilePage = useCallback(
    async (page, apiPage) => {
      var mobileNumberNeededPerPage = Math.floor((window.innerHeight - 230) / 62);
      var totalNumberNeeded = mobileNumberNeededPerPage * page;
      var haveEnough = totalNumberNeeded <= numRunsLoaded;

      var allRunsCopy = [...allPreviousRuns];
      if (!haveEnough) {
        allRunsCopy = [
          ...allRunsCopy,
          ...(await loadMoreRuns(totalNumberNeeded - numRunsLoaded, apiPage)),
        ];
      }

      var subsetForMobile = allRunsCopy.slice(
        (page - 1) * mobileNumberNeededPerPage,
        page * mobileNumberNeededPerPage
      );
      if (subsetForMobile.length < mobileNumberNeededPerPage) {
        var numExtraNeeded = mobileNumberNeededPerPage - subsetForMobile.length;
        for (var i = 0; i < numExtraNeeded; i++) {
          subsetForMobile.push(null);
        }
        setLastPage(page);
      }
      setMobileCurrentRuns([...subsetForMobile]);
      console.log("mobile page", page);
      setMobilePageIndex(page);
    },
    [numRunsLoaded, allPreviousRuns, loadMoreRuns]
  );

  const setInitialRuns = useCallback(async () => {
    console.log("in init runs");
    const initialRuns = [];

    var mobileNumberNeeded = Math.floor((window.innerHeight - 230) / 62);
    console.log(window.innerHeight, mobileNumberNeeded, window.innerHeight - 230);
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
    checkAnotherPage(hasLoadedAllRuns);
    setApiPageIndex(apiPage);

    var subsetForMobile = initialRuns.slice(0, mobileNumberNeeded);

    if (subsetForMobile.length < mobileNumberNeeded) {
      var numExtraNeeded = mobileNumberNeeded - subsetForMobile.length;
      for (var i = 0; i < numExtraNeeded; i++) {
        subsetForMobile.push(null);
      }
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
        {anotherPage ? (
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

export default RunHistoryTabMobile;
