import React, { useEffect, useState, useRef } from "react";
import { useCallback } from "react";

import styles from "./RunHistoryTab.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";
import { RunHistoryService } from "./RunHistoryService";
import EventBus from "../../Helpers/EventBus";

const RunHistoryTab = ({ challengeId, loadRunHandler, gameMode, runLoadingDisabled }) => {
  const oppositeGameMode = gameMode === "replay" ? "Challenge" : "Replay";

  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(null);
  const [runsListPageIndex, setPageIndex] = useState(1);
  const [numRunsLoaded, setNumRunsLoaded] = useState(null);
  const [currentRunsDisplaying, setCurrentRunsDisplaying] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runHistoryService] = useState(new RunHistoryService(challengeId));

  const runsList = useRef(null);

  const getNumberOfRunsToShowPerPage = () => {
    if (!runsList?.current?.offsetHeight) {
      return undefined;
    }
    return Math.floor(runsList.current.offsetHeight / 63);
  };

  const [numberNeededPerPage, setNumberNeededPerPage] = useState(null);

  const appendEmptyPlaceholders = useCallback(runs => {
    var countNeeded = getNumberOfRunsToShowPerPage();
    var extrasNeeded = countNeeded - runs.length;
    for (var i = 0; i < extrasNeeded; i++) {
      runs.push(null);
    }
    return runs;
  }, []);

  const getRunIndicesByPage = useCallback(page => {
    var countNeeded = getNumberOfRunsToShowPerPage();
    var start = (page - 1) * countNeeded;
    var end = start + countNeeded;
    return { start, end };
  }, []);

  const goToPage = useCallback(
    async page => {
      setLoading(true);
      var { start, end } = getRunIndicesByPage(page);
      runHistoryService.getRunsBetween(start, end).then(res => {
        setHasGrabbedAllValidPrevRuns(res.endReached);
        setCurrentRunsDisplaying(appendEmptyPlaceholders(res.runs));
        setPageIndex(page);
        setLoading(false);
      });
    },
    [getRunIndicesByPage, runHistoryService, appendEmptyPlaceholders]
  );

  useEffect(() => {
    var { start, end } = getRunIndicesByPage(runsListPageIndex);

    setLoading(true);
    runHistoryService.getRunsBetween(start, end).then(res => {
      if (res.runs.length < 1 && runsListPageIndex > 1) {
        goToPage(runsListPageIndex - 1);
        return;
      }
      setHasGrabbedAllValidPrevRuns(res.endReached);
      setCurrentRunsDisplaying(appendEmptyPlaceholders(res.runs));
      setNumRunsLoaded(res.numLoaded);
      setLoading(false);
    });
  }, [
    runHistoryService,
    challengeId,
    goToPage,
    numberNeededPerPage,
    runsListPageIndex,
    appendEmptyPlaceholders,
    getRunIndicesByPage,
  ]);

  useEffect(() => {
    function debounce(fn, ms) {
      let timer;
      return _ => {
        clearTimeout(timer);
        timer = setTimeout(_ => {
          timer = null;
          fn.apply(this, arguments);
        }, ms);
      };
    }

    const debouncedResize = debounce(function handleResize() {
      setNumberNeededPerPage(getNumberOfRunsToShowPerPage());
    }, 1000);

    window.addEventListener("resize", debouncedResize);
    return _ => {
      window.removeEventListener("resize", debouncedResize);
    };
  });

  useEffect(() => {
    runHistoryService.registerRunSubmittedListener();

    return _ => {
      runHistoryService.removeRunSubmittedListener();
    };
  }, [runHistoryService]);

  const refreshRuns = useCallback(() => {
    goToPage(runsListPageIndex);
  }, [goToPage, runsListPageIndex]);

  useEffect(() => {
    var runHistoryUpdatedListenerId = EventBus.on("runHistoryUpdated", refreshRuns);

    return _ => {
      EventBus.remove("runHistoryUpdated", runHistoryUpdatedListenerId);
    };
  }, [refreshRuns]);

  const oppositeGameModeAllowed = () => {
    return !(!ChallengeHandler.config.active && oppositeGameMode === "Challenge");
  };

  const doneLoading = useCallback(
    () => !loading && hasGrabbedAllValidPrevRuns !== null,
    [hasGrabbedAllValidPrevRuns, loading]
  );
  const morePages = useCallback(() => {
    var numNeeded = getNumberOfRunsToShowPerPage();
    return (
      doneLoading() &&
      (!hasGrabbedAllValidPrevRuns ||
        (numNeeded && runsListPageIndex !== Math.ceil(numRunsLoaded / numNeeded)))
    );
  }, [doneLoading, hasGrabbedAllValidPrevRuns, numRunsLoaded, runsListPageIndex]);

  return (
    <div className={styles.container}>
      <>
        <p className={styles.title}>
          {doneLoading() ? `Previous Run${`${numRunsLoaded > 1}` && "s"}` : ""}
        </p>
        {oppositeGameModeAllowed() && doneLoading() ? (
          <a href={`/${oppositeGameMode.toLowerCase()}/${challengeId}`}>{oppositeGameMode}</a>
        ) : (
          <span />
        )}
        {doneLoading() ? (
          <div className={styles.runsList} ref={runsList}>
            {currentRunsDisplaying.map((value, index) => (
              <RunEntry
                run={value}
                key={index}
                disabled={runLoadingDisabled}
                loadRun={run => loadRunHandler(run)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.loading} ref={runsList}>
            Loading...
          </div>
        )}
        <div className={styles.pagingBar}>
          {runsListPageIndex !== 1 ? (
            <span className={styles.link} onClick={() => goToPage(runsListPageIndex - 1)}>
              &lt;&lt;
            </span>
          ) : (
            <span>&nbsp;&nbsp;</span>
          )}
          <span> {runsListPageIndex} </span>
          {morePages() ? (
            <span className={styles.link} onClick={() => goToPage(runsListPageIndex + 1)}>
              &gt;&gt;
            </span>
          ) : (
            <span>&nbsp;&nbsp;</span>
          )}
        </div>
      </>
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
      <span>{run.index}</span>
      <div className={styles.runDetails}>
        <span className={styles.date}>{dateValue.toLocaleDateString()}</span>
        <span className={styles.score}>{run.score}</span>
        <span className={styles.time}>
          {dateValue.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {(run.pr || run.wr) && (
          <div className={styles.tags}>
            {run.pr && <span className={styles.prText}>PR</span>}
            {run.wr && <span className={styles.wrText}>WR</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default RunHistoryTab;
