import React, { useEffect, useState } from "react";
import { useCallback } from "react";
import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTab.module.css";

const RunHistoryTab = props => {
  var challengeId = props.challengeID;

  const [latestRunHistoryTime, setLatestRunHistoryTime] = useState(new Date());
  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(false);
  const [previousRuns, setPreviousRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const addRuns = useCallback(
    async itemsToGrab => {
      if (!hasGrabbedAllValidPrevRuns) {
        getPreviousRunData({
          challengeId,
          timeBefore: latestRunHistoryTime,
          itemsToGrab: itemsToGrab,
        }).then(result => {
          setHasGrabbedAllValidPrevRuns(result.length < itemsToGrab); //todo: when no runs, the "load more" button will flash b4 this completes
          setPreviousRuns([...previousRuns, ...result]);
          if (result.length > 0)
            setLatestRunHistoryTime(new Date(result[result.length - 1]?.submissionTime));
        });
      }
    },
    [challengeId, hasGrabbedAllValidPrevRuns, latestRunHistoryTime, previousRuns]
  );

  useEffect(() => {
    addRuns(15).then(() => setLoading(false)); //todo: this doesn't work
  }, []);

  return (
    <div className={styles.container}>
      {!loading ? (
        <>
          <h2 className={styles.title}>Last {previousRuns.length} Runs</h2>
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
        <></>
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
      <div className={styles.tags}>{run.types.toString()}</div>
    </div>
  );
};

export default RunHistoryTab;
