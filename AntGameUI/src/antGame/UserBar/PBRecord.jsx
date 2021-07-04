import { useState, useEffect } from "react";
import ChallengeHandler from "../Challenge/ChallengeHandler";
import styles from "./PBRecord.module.css";

const PBRecord = (props) => {
  const [record, setRecord] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ChallengeHandler.addRecordListener((records) => {
      if (records === "Anon") setRecord("Login to save score");
      else if (records === null) setRecord("Not set");
      else setRecord(`Personal Best: ${records.pb}`);
      if (loading) setLoading(false);
    });
  });

  return <div>{loading ? null : <p className={styles.best}>{record}</p>}</div>;
};
export default PBRecord;
