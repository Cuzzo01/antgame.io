import { useState, useEffect } from "react";
import ChallengeHandler from "../Challenge/ChallengeHandler";
import styles from "./RecordDisplay.module.css";

const WorldRecord = (props) => {
  const [record, setRecord] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ChallengeHandler.addRecordListener((records) => {
      if (!records.wr) setRecord("No World Record");
      else setRecord(`World Record: ${records.wr.score} - ${records.wr.name}`);
      if (loading) setLoading(false);
    });
  });

  return <div>{loading ? null : <p className={styles.best}>{record}</p>}</div>;
};
export default WorldRecord;
