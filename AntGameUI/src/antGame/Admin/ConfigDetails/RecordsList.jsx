import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ConfigDetails.module.css";

const RecordsList = props => {
  const records = props.records;
  const [expanded, setExpanded] = useState(false);

  let list = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const recordDate = new Date(record.time);
    list.push(
      <div className={styles.recordEntry}>
        ({recordDate.toLocaleDateString()} {recordDate.toLocaleTimeString()})&nbsp;
        <Link to={`/admin/run/${record.runID}`}>{record.score}</Link> -{" "}
        <Link to={`/admin/user/${record.userID}`}>{record.username}</Link>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.divButton} onClick={() => setExpanded(!expanded)}>
        Records
      </div>
      {expanded ? <div className={styles.recordsList}>{list}</div> : null}
    </div>
  );
};
export default RecordsList;
