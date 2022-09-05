import React, { useEffect, useState } from "react";
import { useCallback } from "react";
import { getPreviousRunData } from "../../Challenge/ChallengeService";
import styles from "./RunHistoryTab.module.css";

const RunHistoryTab = props => {
  var loadRunHandler = props.loadRunHandler;
  var challengeId = props.challengeID;

  const [latestRunHistoryTime, setLatestRunHistoryTime] = useState(new Date());
  const [hasGrabbedAllValidPrevRuns, setHasGrabbedAllValidPrevRuns] = useState(false);
  const [previousRuns, setPreviousRuns] = useState([]);
  const itemsToGrab = 10;

  useEffect(() => {
    console.log(challengeId);
    // addRunHistory().then(() => {
    //   console.log(previousRuns);
    // })
    async function loadIntitialPastRuns(challengeId) {
      const locations = await getPreviousRunData({challengeId, timeBefore: new Date(), itemsToGrab: 10});
      setPreviousRuns(locations);
      if(locations.length < 10) setHasGrabbedAllValidPrevRuns(true);
      if(locations.length > 0) setLatestRunHistoryTime(new Date(locations[locations.length-1]?.submissionTime));
    }
    loadIntitialPastRuns(challengeId);
  }, [challengeId]);

  return (
    <>hello {previousRuns.length} {latestRunHistoryTime.toDateString()}</>
  );
};

export default RunHistoryTab;
