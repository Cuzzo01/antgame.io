import React, { useEffect, useState } from "react";
import { useCallback } from "react";
import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTab.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";


const RunHistoryTab = props => {
  var challengeId = props.challengeID;
  const oppositeGameMode = props.gameMode === "replay" ? "Challenge" : "Replay";

  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [previousRuns, setPreviousRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const addRuns = useCallback(async () => {
    if (!hasGrabbedAllValidPrevRuns) {
      getPreviousRunData({
        challengeId,
        pageIndex,
      }).then(result => {
        setHasGrabbedAllValidPrevRuns((result.runs.length < result.pageLength));
        setPreviousRuns([...previousRuns, ...result.runs]);
        setPageIndex(prev => prev + 1);
      });
    }
  }, [challengeId, hasGrabbedAllValidPrevRuns, pageIndex, previousRuns]);

  useEffect(() => {
    addRuns().then(() => setLoading(false));
  }, []);

  const doneLoading = () => {
    return !loading && hasGrabbedAllValidPrevRuns !== null;
  };

  return (
    <div className={styles.container}>
      {doneLoading() ? (
        <>
          <h2 className={styles.title}>Last {previousRuns?.length} Runs</h2>
          {(!(!ChallengeHandler.config.active && oppositeGameMode === "Challenge")) && (<a href={`/${oppositeGameMode}/${challengeId}`}>{oppositeGameMode}</a>)}
          <div className={styles.runsList}>
            {previousRuns.map((value, index) => (
              <RunEntry run={value} key={index} action={run => props.loadRunHandler(run)} />
            ))}
            {!hasGrabbedAllValidPrevRuns ? (
              <div className={styles.loadMore} onClick={() => addRuns(10)}>
                Load More{">>"}
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

const RunEntry = props => {
  const run = props.run;

  const dateValue = new Date(run.submissionTime);

  return (
    <div className={styles.runEntryRow} onClick={() => props.action(run)}>
      <div className={styles.date}>{dateValue.toLocaleDateString()}</div>
      <div className={styles.score}>{run.score}</div>
      <div className={styles.time}>{dateValue.toLocaleTimeString()}</div>
      {run.pr ? (
        <div className={styles.tags}>
          <span className={styles.prText}>PR</span>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default RunHistoryTab;
