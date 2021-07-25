import { useState, useEffect } from "react";
import AuthHandler from "../Auth/AuthHandler";
import ChallengeHandler from "../Challenge/ChallengeHandler";
import styles from "./RecordDisplay.module.css";

const PersonalRecord = props => {
  const [record, setRecord] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (AuthHandler.isAnon) {
      setRecord("Login to track PRs");
      setLoading(false);
    } else
      ChallengeHandler.addRecordListener(records => {
        if (!records.pr) setRecord("No Personal Record");
        else
          setRecord(
            <div>
              Personal Record: {records.pr} 
              <span className={styles.bold} title="Leaderboard Rank">
                &nbsp;#{records.rank}
              </span>
            </div>
          );
        if (loading) setLoading(false);
      });
  }, [loading]);

  return <div>{loading ? null : record}</div>;
};
export default PersonalRecord;
