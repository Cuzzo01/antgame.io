import React, { useEffect, useState } from "react";
import { useCallback } from "react";

import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTab.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";

class Service {
  loadAllRuns = async (challengeId) => {
    var hasLoadedAll = false;
    var apiPage = 1;
    var allRuns = [];

    while (!hasLoadedAll) {
      var result = await getPreviousRunData({
        challengeId,
        pageIndex: apiPage,
      });
      apiPage++;
      if (result) {
        allRuns.push(...result.runs);
        hasLoadedAll = result.reachedEndOfBatch;
      } else {
        hasLoadedAll = true;
      }
    }
    return allRuns;
  };

  async getRunsBetween(challengeId, start, end) {
    console.log(start, end);
    var result = await this.loadAllRuns(challengeId);
    console.log(result);
    return { runs: result.slice(start, end), endReached: true, numLoaded: result.length };
  }
}

const RunHistoryTab = ({ challengeId, loadRunHandler, gameMode, disabled }) => {
  const oppositeGameMode = gameMode === "replay" ? "Challenge" : "Replay";

  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(null);
  const [runsListPageIndex, setPageIndex] = useState(1);
  const [numRunsLoaded, setNumRunsLoaded] = useState(0);
  const [currentRunsDisplaying, setCurrentRunsDisplaying] = useState([]);
  const [loading, setLoading] = useState(true);
  const [numberNeededPerPage, setNumberNeededPerPage] = useState(Math.floor((window.innerHeight - 230) / 63));
  const [startIndex, setStartIndex] = useState(0);
  const [service] = useState(new Service());




  const goToPage = useCallback(
    async (page) => {
      setLoading(true);
      var start = (page - 1) * numberNeededPerPage;
      var end = start + numberNeededPerPage;
      setStartIndex(start);
      service.getRunsBetween(challengeId, start, end).then((res) => {
        setHasGrabbedAllValidPrevRuns(res.endReached);
        setCurrentRunsDisplaying(res.runs);
        setPageIndex(page);
        setLoading(false);
      });
    },
    [service, challengeId, numberNeededPerPage]
  );

  useEffect(() => {
    var start = (runsListPageIndex - 1) * numberNeededPerPage;
    var end = start + numberNeededPerPage;
    setStartIndex(start);
    setLoading(true)
    service.getRunsBetween(challengeId, start, end).then((res) => {
      if (res.runs.length < 1 && runsListPageIndex > 1) {
        goToPage(runsListPageIndex - 1);
        return;
      }
      setHasGrabbedAllValidPrevRuns(res.endReached);
      setCurrentRunsDisplaying(res.runs);
      setNumRunsLoaded(res.numLoaded);
      setLoading(false);
    });
  }, [service, challengeId, goToPage, numberNeededPerPage, runsListPageIndex]);

  function debounce(fn, ms) {
    let timer
    return _ => {
      clearTimeout(timer)
      timer = setTimeout(_ => {
        timer = null
        fn.apply(this, arguments)
      }, ms)
    };
  }


  useEffect(() => {
    const debouncedResize = debounce(function handleResize() {
      setNumberNeededPerPage(Math.floor((window.innerHeight - 230) / 63));
    }, 1000);

    window.addEventListener('resize', debouncedResize);
    return _ => {
      window.removeEventListener('resize', debouncedResize)

    }
  })

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
          <h2 className={styles.title}>Previous Run{numRunsLoaded > 1 && "s"}</h2>
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
          <div className={styles.pagingBar}>{`Runs ${startIndex + 1} - ${startIndex + currentRunsDisplaying.length}`}</div>
          <div className={styles.pagingBar}>
            {runsListPageIndex !== 1 ? (
              <span
                className={styles.link}
                onClick={() => goToPage(runsListPageIndex - 1)}
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
                onClick={() => goToPage(runsListPageIndex + 1)}
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
