import React, { useEffect, useState } from "react";
import styles from "./ChallengeModal.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";
import AuthHandler from "../../Auth/AuthHandler";
import GenericModal from "../../Helpers/GenericModal";

const ChallengeModal = props => {
  const [isWrRun, setIsWrRun] = useState(false);
  const [records, setRecords] = useState();
  const [showRateLimitMessage, setShowRateLimitMessage] = useState(false);
  const [showRejectedMessage, setShowRejectedMessage] = useState(false);

  useEffect(() => {
    const runResponseId = ChallengeHandler.addRunResponseListener(response =>
      handleRunResponse(response)
    );
    const recordID = ChallengeHandler.addRecordListener(records => setRecords(records));
    return () => {
      ChallengeHandler.removeRunResponseListener(runResponseId);
      ChallengeHandler.removeRecordListener(recordID);
    };
  }, []);

  const handleRunResponse = response => {
    if (response === false) {
      setIsWrRun(false);
      setShowRateLimitMessage(false);
      setShowRejectedMessage(false);
    } else if (response.isWrRun) setIsWrRun(true);
    else if (response === "rateLimit") setShowRateLimitMessage(true);
    else if (response === "rejected") setShowRejectedMessage(true);
  };

  const scoreIsNice = props.challengeHandler?.score.toString().endsWith("69");
  return (
    <div>
      {props.show ? (
        <GenericModal
          alwaysShow
          closeMessage={scoreIsNice ? "Nice" : "Close"}
          title={`Results: ${props.challengeHandler?.config.name}`}
          onHide={() => props.closeModal()}
          body={
            <div className={styles.body}>
              <div className={styles.runInfo}>
                {AuthHandler.isAnon ? (
                  <h6>
                    <br />
                    <strong>Score not saved</strong>
                    <br />
                    Login to get on the leaderboard and <br />
                    track personal records.
                  </h6>
                ) : null}
                {isWrRun ? <h4 className={styles.newWR}>New World Record!</h4> : null}
                {showRateLimitMessage ? (
                  <div>
                    <h3>Whoa There</h3>
                    <span>
                      You're submitting runs too fast. <strong>This run did not count.</strong> You
                      can submit two runs per minute. You can submit runs again in 60 seconds.
                    </span>
                  </div>
                ) : null}
                {showRejectedMessage ? (
                  <div>
                    <h3>Run Rejected</h3>
                    <span>
                      This run was rejected by the anti-cheat system. This can happen if you're
                      running old code, or are trying to cheat. If you're seeing this often and not
                      cheating, email us. This page will refresh in 10 seconds.
                    </span>
                  </div>
                ) : null}
                {props.challengeHandler?.isPB ? (
                  <div>
                    <h5 className={styles.newPB}>New Personal Record</h5>
                    <h6 className={styles.leaderboardRank}>
                      Leaderboard Rank: <strong>{records?.rank}</strong>
                      <span className={styles.playerCount}>
                        {records.playerCount ? `/${records.playerCount}` : null}
                      </span>
                    </h6>
                  </div>
                ) : null}
              </div>
              <h5 className={styles.score}>Score</h5>
              <h5>{props.challengeHandler?.score}</h5>
            </div>
          }
        />
      ) : null}
    </div>
  );
};

export default ChallengeModal;
