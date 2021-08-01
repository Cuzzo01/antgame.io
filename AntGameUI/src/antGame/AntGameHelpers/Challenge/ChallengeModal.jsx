import { Modal, Button } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import styles from "./ChallengeModal.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";
import AuthHandler from "../../Auth/AuthHandler";

const ChallengeModal = props => {
  const [isWrRun, setIsWrRun] = useState(false);
  const [records, setRecords] = useState();

  useEffect(() => {
    ChallengeHandler.addWrListener(isWrRun => setIsWrRun(isWrRun));
    ChallengeHandler.addRecordListener(records => setRecords(records));
  });

  return (
    <Modal show={props.show} onHide={() => props.closeModal()} backdrop="static" keyboard={false}>
      <Modal.Header className={styles.header}>Results: {props.challengeHandler?.config.name}</Modal.Header>
      <Modal.Body className={styles.body}>
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
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => props.closeModal()}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChallengeModal;
