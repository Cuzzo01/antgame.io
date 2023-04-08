import React, { useEffect, useState } from "react";
import { useCallback } from "react";
import { isMobile } from "react-device-detect";

import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTab.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";

const RunHistoryTab = ({ challengeId, loadRunHandler, gameMode, disabled }) => {
  const oppositeGameMode = gameMode === "replay" ? "Challenge" : "Replay";

  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(null);
  const [apiPageIndex, setApiPageIndex] = useState(1);
  const [mobilePageIndex, setMobilePageIndex] = useState(1);
  const [allPreviousRuns, setAllPreviousRuns] = useState([]);
  const [mobileCurrentRuns, setMobileCurrentRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const addRuns = useCallback(async () => {
    getPreviousRunData({
      challengeId,
      pageIndex: apiPageIndex,
    }).then(result => {
      if (result) {
        setHasGrabbedAllValidPrevRuns(result.reachedEndOfBatch);
        setAllPreviousRuns(prev => [...prev, ...result.runs]);
      } else {
        setHasGrabbedAllValidPrevRuns(true);
      }
    });
  }, [challengeId, apiPageIndex]);

  const addRunsAsync = useCallback(async () => {
    console.log("in async");
    var result = await getPreviousRunData({
      challengeId,
      pageIndex: apiPageIndex,
    });

    if (result) {
      setHasGrabbedAllValidPrevRuns(result.reachedEndOfBatch);
      setAllPreviousRuns(prev => [...prev, ...result.runs]);
    } else {
      setHasGrabbedAllValidPrevRuns(true);
    }
  }, [apiPageIndex, challengeId]);

  const addRunsMobile = useCallback(async () => {
    console.log("in mobile");

    var mobileNumber = Math.floor((window.innerHeight - 200) / 65);

    var neededTotalRuns = mobileNumber * mobilePageIndex;
    var alreadyHaveEnough = neededTotalRuns < allPreviousRuns.length;
    if (alreadyHaveEnough) {
      setMobileCurrentRuns([
        ...allPreviousRuns.slice(
          (mobilePageIndex - 1) * mobileNumber,
          mobilePageIndex * mobileNumber
        ),
      ]);
      console.log("in true", allPreviousRuns);

      setLoading(false);
    } else {
      console.log("in else");

      addRunsAsync().then(() => addRunsMobile());
      // await addRuns();
      // await addRunsMobile();
    }
  }, [addRunsAsync, allPreviousRuns, mobilePageIndex]);

  useEffect(() => {
    if (isMobile) {
      addRunsMobile();
    } else {
      addRuns().then(() => setLoading(false));
    }
  }, [addRuns, addRunsMobile]);

  const oppositeGameModeAllowed = () => {
    return !(!ChallengeHandler.config.active && oppositeGameMode === "Challenge");
  };

  const doneLoading = !loading && hasGrabbedAllValidPrevRuns !== null;

  return (
    <div className={styles.container}>
      {doneLoading ? (
        <>
          {isMobile ? (
            <>
              <h2 className={styles.title}>Previous Run{allPreviousRuns.length > 1 && "s"}</h2>
              {oppositeGameModeAllowed() && (
                <a href={`/${oppositeGameMode.toLowerCase()}/${challengeId}`}>{oppositeGameMode}</a>
              )}
              <div className={styles.runsList}>
                {mobileCurrentRuns?.map((value, index) => (
                  <RunEntry
                    run={value}
                    key={index}
                    disabled={disabled}
                    loadRun={run => loadRunHandler(run)}
                  />
                ))}
                {mobilePageIndex !== 1 ? (
                  <div
                    className={styles.loadMore}
                    onClick={() => setMobilePageIndex(apiPageIndex - 1)}
                  >
                    {"<<"} Prev
                  </div>
                ) : (
                  <></>
                )}
                {!hasGrabbedAllValidPrevRuns ? (
                  <div
                    className={styles.loadMore}
                    onClick={() => setMobilePageIndex(apiPageIndex + 1)}
                  >
                    Next {">>"}
                  </div>
                ) : (
                  <></>
                )}
              </div>
              <div className={styles.bottombar} />
            </>
          ) : (
            <>
              <h2 className={styles.title}>
                Last {allPreviousRuns.length} Run{allPreviousRuns.length > 1 && "s"}
              </h2>
              {oppositeGameModeAllowed() && (
                <a href={`/${oppositeGameMode.toLowerCase()}/${challengeId}`}>{oppositeGameMode}</a>
              )}
              <div className={styles.runsList}>
                {allPreviousRuns.map((value, index) => (
                  <RunEntry
                    run={value}
                    key={index}
                    disabled={disabled}
                    loadRun={run => loadRunHandler(run)}
                  />
                ))}
                {!hasGrabbedAllValidPrevRuns ? (
                  <div
                    className={styles.loadMore}
                    onClick={() => setApiPageIndex(apiPageIndex + 1)}
                  >
                    Load More {">>"}
                  </div>
                ) : (
                  <div>No {allPreviousRuns.length > 0 ? "More " : ""}Loadable Runs</div>
                )}
              </div>
              <div className={styles.bottombar} />
            </>
          )}
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

export default RunHistoryTab;
