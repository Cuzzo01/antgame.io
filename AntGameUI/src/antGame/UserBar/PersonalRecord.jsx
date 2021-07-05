import { useState, useEffect } from "react";
import AuthHandler from "../Auth/AuthHandler";
import ChallengeHandler from "../Challenge/ChallengeHandler";
import styles from "./RecordDisplay.module.css";

const PersonalRecord = (props) => {
  const [record, setRecord] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (AuthHandler.isAnon) {
      setRecord("Login to track PB");
      setLoading(false);
    } else
      ChallengeHandler.addRecordListener((records) => {
        if (!records.pb) setRecord("No recorded PB");
        else setRecord(`Personal Best: ${records.pb}`);
        if (loading) setLoading(false);
      });
  });

  return <div>{loading ? null : <p className={styles.best}>{record}</p>}</div>;
};
export default PersonalRecord;
