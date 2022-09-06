import React, { useEffect, useState } from "react";
import { useRef } from "react";
import { useCallback } from "react";
import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTab.module.css";

const heightOfRowPlusMargin = 55;

const RunHistoryTab = props => {

  const listRef = useRef();
  var challengeId = props.challengeID;

  const [latestRunHistoryTime, setLatestRunHistoryTime] = useState(new Date());
  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(false);
  const [previousRuns, setPreviousRuns] = useState([]);

  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [loading, setLoading] = useState(false);

const updateItemsToGrab = useCallback(() => {
  var amountToLoad = Math.floor(listRef.current?.clientHeight / heightOfRowPlusMargin);
  console.log(listRef.current?.offsetTop)
  var nextLowMultOf5 = amountToLoad - (amountToLoad % 5);

  console.log(amountToLoad, nextLowMultOf5);
  setItemsPerPage(nextLowMultOf5);
return amountToLoad}, []);

  useEffect(() => {
    console.log(challengeId);
    updateItemsToGrab();
    addRuns();
  }, [challengeId]);

  const addRuns = useCallback(async() => {
    if(!hasGrabbedAllValidPrevRuns){
      getPreviousRunData({challengeId, timeBefore: latestRunHistoryTime, itemsToGrab: itemsPerPage}).then(result => {
        setPreviousRuns([...previousRuns, ...result]);
        if(result.length < itemsPerPage) setHasGrabbedAllValidPrevRuns(true);
        if(result.length > 0) setLatestRunHistoryTime(new Date(result[result.length-1]?.submissionTime));
      })
    }
  });

  useEffect(() => {
    console.log("added length");
  }, [previousRuns.length]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Last {previousRuns.length} Runs</h2>
      {/* <div className={styles.runsList}>
        {previousRuns.map((value, index) => (<RunEntry run={value} key={index} action={(run) => props.loadRunHandler(run)}/>))}
      </div> */}
      <div ref={listRef} className={styles.runsList}>
      {!loading ? 
      previousRuns.map((value, index) => (<RunEntry run={value} key={index} action={(run) => props.loadRunHandler(run)}/>)) 
      // <RunList loadRunHandler={props.loadRunHandler} previousRuns={previousRuns}></RunList>
      : <></>}

        {!hasGrabbedAllValidPrevRuns ? <div onClick={addRuns}>Load More{">>"}</div> : <div>All Loadable Runs Loaded</div>}
      </div>
      <div className={styles.bottombar}></div>
    </div>
  );
};

const RunList = props => {
  return (
    <div className={styles.innerList}>

      {props.previousRuns.map((value, index) => (<RunEntry run={value} key={index} action={(run) => props.loadRunHandler(run)}/>))}
    </div>
      )
}

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
  )
}

export default RunHistoryTab;
