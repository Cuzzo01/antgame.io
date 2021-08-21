import { useEffect, useState } from "react";
import { getRecentRuns } from "../AdminService";
import styles from "./RunsList.module.css";
import { Link } from "react-router-dom";

const RunsList = props => {
  const [runsList, setRunsList] = useState(false);

  useEffect(() => {
    getRecentRuns(15).then(runs => {
      let list = [];
      for (let i = 0; i < runs.length; i++) {
        const run = runs[i];
        list.push(
          <RunsListElement theme={i % 2 === 0 ? styles.even : styles.odd} run={run} key={run._id} />
        );
      }
      setRunsList(list);
    });
  }, []);

  return (
    <div className={styles.container}>
      <h3>Runs</h3>
      {runsList ? runsList : null}
    </div>
  );
};
export default RunsList;

const RunsListElement = props => {
  const submissionDateTime = new Date(props.run.submissionTime);
  return (
    <div className={`${styles.runRow} ${props.theme}`}>
      <span className={styles.time}>
        {submissionDateTime.toLocaleDateString()} {submissionDateTime.toLocaleTimeString()}
      </span>
      <span className={styles.userID}>
        <Link to={`/admin/user/${props.run.userID}`}>{props.run.userID ? props.run.userID.substr(-6) : "N/A"}</Link>
      </span>
      <span className={styles.score}>
        <Link to={`/admin/run/${props.run._id}`}>{props.run.score}</Link>
      </span>
      <span className={styles.challengeName}>
        <Link to={`/admin/config/${props.run.challengeID}`}>{props.run.name}</Link>
      </span>
    </div>
  );
};
