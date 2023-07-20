import React, { useEffect, useState } from "react";
import styles from "./ChallengeModal.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";
import AuthHandler from "../../Auth/AuthHandler";
import GenericModal from "../../Helpers/GenericModal";
import { useCallback } from "react";
import Countdown from "react-countdown";

const ChallengeModal = props => {
  const [isWrRun, setIsWrRun] = useState(false);
  const [records, setRecords] = useState();
  const [showRateLimitMessage, setShowRateLimitMessage] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState(false);
  const [showRejectedMessage, setShowRejectedMessage] = useState(false);
  const [closeMessage, setCloseMessage] = useState("Close");

  const updateCloseMessage = useCallback(() => {
    const score = ChallengeHandler.score;
    if (score) {
      const scoreIsNice = score.toString().endsWith("69");
      const scoreIsDoubleNice = score.toString().match(/69/gm)?.length === 2;

      let message = "Close";
      if (scoreIsDoubleNice) message = "Nice, Nice";
      else if (scoreIsNice) message = "Nice";

      setCloseMessage(message);
    }
  }, []);

  const handleRunResponse = useCallback(
    (response, resetTime) => {
      if (response === false) {
        setIsWrRun(false);
        setShowRateLimitMessage(false);
        setShowRejectedMessage(false);
      } else if (response === "rateLimit") {
        const resetDate = new Date();
        resetDate.setSeconds(resetDate.getSeconds() + resetTime);

        setRateLimitMessage(
          <>
            This run didn't count. If you keep this window open, it will be resubmitted
            <Countdown date={resetDate} intervalDelay={1000} renderer={renderer} />.
          </>
        );
        setShowRateLimitMessage(true);
      } else if (response === "rejected") setShowRejectedMessage(true);
      else if (response.isWrRun) setIsWrRun(true);
      else if (showRateLimitMessage) {
        setRateLimitMessage(<>The run has been resubmitted successfully!</>);
      }
    },
    [showRateLimitMessage]
  );

  useEffect(() => {
    const runResponseId = ChallengeHandler.addRunResponseListener(handleRunResponse);
    const recordID = ChallengeHandler.addRecordListener(setRecords);

    updateCloseMessage();

    return () => {
      ChallengeHandler.removeRunResponseListener(runResponseId);
      ChallengeHandler.removeRecordListener(recordID);
    };
  }, [handleRunResponse, updateCloseMessage]);

  useEffect(() => {
    if (!props.show) ChallengeHandler.clearResendTimeout();
  }, [props.show]);

  return (
    <div>
      {props.show ? (
        <GenericModal
          alwaysShow
          closeMessage={closeMessage}
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
                    <span>You're submitting runs too fast. You can submit 3 runs per minute.</span>
                    <br />
                    <br />
                    {rateLimitMessage}
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

const renderer = ({ minutes, seconds, completed }) => {
  if (completed) {
    return " now";
  }

  let secondsLeft = 0;
  if (minutes) secondsLeft += minutes * 60;
  secondsLeft += seconds;

  return ` in ${secondsLeft} seconds`;
};
