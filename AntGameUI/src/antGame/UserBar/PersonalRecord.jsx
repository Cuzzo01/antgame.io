import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthHandler from "../Auth/AuthHandler";
import ChallengeHandler from "../Challenge/ChallengeHandler";
import styles from "./RecordDisplay.module.css";

const PersonalRecord = props => {
  const [content, setContent] = useState();
  const [linkPath, setLinkPath] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let listenerID = 0;
    if (AuthHandler.isAnon) {
      setContent("Login to track PRs");
      setLoading(false);
    } else {
      listenerID = ChallengeHandler.addRecordListener(records => {
        if (!records.pr) setContent("No Personal Record");
        else {
          buildAndSetLink();
          setContent(
            <div>
              Personal Record: {records.pr}&nbsp;
              <Link to={linkPath}>
                <span className={styles.bold} title="Leaderboard">
                  #{records.rank}
                </span>
              </Link>
              {records.playerCount ? (
                <span className={styles.playerCount}>/{records.playerCount}</span>
              ) : null}
            </div>
          );
        }
        if (loading) setLoading(false);
      });
    }

    return () => {
      ChallengeHandler.removeRecordListener(listenerID);
    };
  }, [loading, linkPath]);

  const buildAndSetLink = async () => {
    const challengeID = (await ChallengeHandler.getConfig()).id;
    setLinkPath(`/challenge/leaderboard/${challengeID}`);
  };

  return <div>{loading ? null : content}</div>;
};
export default PersonalRecord;
