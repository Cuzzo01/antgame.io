import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthHandler from "../Auth/AuthHandler";
import ChallengeHandler from "../Challenge/ChallengeHandler";
import styles from "./RecordDisplay.module.css";

const PersonalRecord = props => {
  const [content, setContent] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = new URL(window.location);
    const pathArr = url.pathname.split("/");
    const challengeId = pathArr[pathArr.length - 1];
    let listenerID;
    if (AuthHandler.isAnon) {
      setContent("Login to track PRs");
      setLoading(false);
    } else {
      listenerID = ChallengeHandler.addRecordListener(records => {
        if (!records.pr) setContent("No Personal Record");
        else {
          setContent(
            <div>
              PR: {records.pr}&nbsp;
              <Link to={`/challenge/${challengeId}/leaderboard`}>
                <span className={styles.bold} title="Leaderboard">
                  #{records.rank}
                </span>
              </Link>
              {records.playerCount ? <span className={styles.playerCount}>/{records.playerCount}</span> : null}
            </div>
          );
        }
        if (loading) setLoading(false);
      });
    }

    return () => {
      if (listenerID !== null) ChallengeHandler.removeRecordListener(listenerID);
    };
  }, [loading]);

  return <div>{loading ? null : content}</div>;
};
export default PersonalRecord;
