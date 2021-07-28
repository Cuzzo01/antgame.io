import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthHandler from "../Auth/AuthHandler";
import ChallengeHandler from "../Challenge/ChallengeHandler";
import styles from "./RecordDisplay.module.css";

const PersonalRecord = props => {
  const [content, setContent] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const challengeID = window.location.pathname.substr(-24);
    if (AuthHandler.isAnon) {
      setContent("Login to track PRs");
      setLoading(false);
    } else
      ChallengeHandler.addRecordListener(records => {
        if (!records.pr) setContent("No Personal Record");
        else
          setContent(
            <div>
              Personal Record: {records.pr}&nbsp;
              <Link to={`/challenge/leaderboard/${challengeID}`}>
                <span className={styles.bold} title="Leaderboard">
                  #{records.rank}
                </span>
              </Link>
            </div>
          );
        if (loading) setLoading(false);
      });
  }, [loading]);

  return <div>{loading ? null : content}</div>;
};
export default PersonalRecord;
