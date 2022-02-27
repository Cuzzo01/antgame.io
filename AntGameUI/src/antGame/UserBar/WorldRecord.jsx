import { useState, useEffect } from "react";
import ChallengeHandler from "../Challenge/ChallengeHandler";
import DailyCountdown from "../Challenge/DailyCountdown/DailyCountdown";
import Username from "../User/Username";
import styles from "./RecordDisplay.module.css";

const WorldRecord = props => {
  const [record, setRecord] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const listenerID = ChallengeHandler.addRecordListener(records => {
      if (!records.wr) setRecord("No World Record");
      else
        setRecord(
          <span>
            WR: {records.wr.score} -{" "}
            <Username name={records.wr.name} id={records.wr.id} showBorder={false} />
          </span>
        );
      if (loading) setLoading(false);
    });

    return () => {
      ChallengeHandler.removeRecordListener(listenerID);
    };
  }, [loading]);

  return (
    <div className={styles.bold}>
      {loading ? null : (
        <span>
          {window.location.pathname === "/challenge/daily" ? (
            <span>
              Ends in <DailyCountdown short />
              &nbsp;|&nbsp;
            </span>
          ) : null}
          {record}
        </span>
      )}
    </div>
  );
};
export default WorldRecord;
