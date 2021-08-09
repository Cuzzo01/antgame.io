import { useState, useEffect } from "react";
import ChallengeHandler from "../Challenge/ChallengeHandler";
import styles from "./RecordDisplay.module.css";

const WorldRecord = props => {
  const [record, setRecord] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const listenerID = ChallengeHandler.addRecordListener(records => {
      if (!records.wr) setRecord("No World Record");
      else setRecord(`World Record: ${records.wr.score} - ${records.wr.name}`);
      if (loading) setLoading(false);
    });

    return () => {
      ChallengeHandler.removeRecordListener(listenerID);
    };
  }, [loading]);

  return <div>{loading ? null : <span className={styles.bold}>{record}</span>}</div>;
};
export default WorldRecord;
