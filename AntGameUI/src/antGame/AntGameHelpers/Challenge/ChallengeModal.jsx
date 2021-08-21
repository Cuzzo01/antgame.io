import React, { useEffect, useState } from "react";
import styles from "./ChallengeModal.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";
import AuthHandler from "../../Auth/AuthHandler";
import GenericModal from "../../Helpers/GenericModal";

const ChallengeModal = props => {
  const [isWrRun, setIsWrRun] = useState(false);
  const [records, setRecords] = useState();

  useEffect(() => {
    const wrID = ChallengeHandler.addWrListener(isWrRun => setIsWrRun(isWrRun));
    const recordID = ChallengeHandler.addRecordListener(records => setRecords(records));
    return () => {
      ChallengeHandler.removeWrListener(wrID);
      ChallengeHandler.removeRecordListener(recordID);
    };
  }, []);

  return (
    <div>
      {props.show ? (
        <GenericModal
          alwaysShow
          title={`Results: ${props.challengeHandler?.config.name}`}
          onHide={() => props.closeModal()}
          body={
            <div className={styles.body}>
              <div className={styles.runInfo}>
                {isWrRun ? <h4 className={styles.newWR}>New World Record!</h4> : null}
                {props.challengeHandler?.isPB ? (
                  <div>
                    <h5 className={styles.newPB}>New Personal Record</h5>
                    <h6>Leaderboard Rank: {records?.rank}</h6>
                  </div>
                ) : null}
              </div>
              <h5 className={styles.score}>Score</h5>
              <h5>{props.challengeHandler?.score}</h5>
              {AuthHandler.isAnon ? (
                <h6>
                  <br />
                  Score not saved
                  <br />
                  Login to save score.
                </h6>
              ) : null}
            </div>
          }
        />
      ) : null}
    </div>
  );
};

export default ChallengeModal;
