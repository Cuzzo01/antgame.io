import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ConfigDetails.module.css";

const RecordsList = props => {
  const records = props.records;
  const [expanded, setExpanded] = useState(false);

  let list = [];
  if (records) {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordDate = new Date(record.time);
      list.push(
        <div className={styles.recordEntry}>
          <span title="Local time">
            ({recordDate.toLocaleDateString()} {recordDate.toLocaleTimeString()})
          </span>
          &nbsp;
          <Link to={`/admin/run/${record.runID}`}>{record.score}</Link> -{" "}
          <Link to={`/admin/user/${record.userID}`}>{record.username}</Link>
        </div>
      );
    }
  } else {
    list.push(<div className={styles.recordEntry}>No Records</div>);
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
