import React, { useEffect, useState } from "react";
import { useCallback } from "react";
import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTab.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";

const RunHistoryTab = ({ challengeId, loadRunHandler, gameMode, disabled }) => {
  const oppositeGameMode = gameMode === "replay" ? "Challenge" : "Replay";

  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [previousRuns, setPreviousRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const addRuns = useCallback(async () => {
    getPreviousRunData({
      challengeId,
      pageIndex,
    }).then(result => {
      if (result) {
        setHasGrabbedAllValidPrevRuns(result.reachedEndOfBatch);
        setPreviousRuns(prev => [...prev, ...result.runs]);
      } else {
        setHasGrabbedAllValidPrevRuns(true);
      }
    });
  }, [challengeId, pageIndex]);

  useEffect(() => {
    addRuns().then(() => setLoading(false));
  }, [addRuns]);

  const oppositeGameModeAllowed = () => {
    return !(!ChallengeHandler.config.active && oppositeGameMode === "Challenge");
  };

  const doneLoading = !loading && hasGrabbedAllValidPrevRuns !== null;

  return (
    <div className={styles.container}>
      {doneLoading ? (
        <>
          <h2 className={styles.title}>
            Last {previousRuns.length} Run{previousRuns.length > 1 && "s"}
          </h2>
          {oppositeGameModeAllowed() && (
            <a href={`/${oppositeGameMode.toLowerCase()}/${challengeId}`}>{oppositeGameMode}</a>
          )}
          <div className={styles.runsList}>
            {previousRuns.map((value, index) => (
              <RunEntry
                run={value}
                key={index}
                disabled={disabled}
                loadRun={run => loadRunHandler(run)}
              />
            ))}
            {!hasGrabbedAllValidPrevRuns ? (
              <div className={styles.loadMore} onClick={() => setPageIndex(pageIndex + 1)}>
                Load More {">>"}
              </div>
            ) : (
              <div>No {previousRuns.length > 0 ? "More " : ""}Loadable Runs</div>
            )}
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

export default RunHistoryTab;
