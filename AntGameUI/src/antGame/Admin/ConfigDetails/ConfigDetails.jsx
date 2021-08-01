import { useEffect, useState } from "react";
import { getConfigDetails } from "../AdminService";
import styles from "./ConfigDetails.module.css";
import RecordsList from "./RecordsList";

const ConfigDetails = props => {
  const [details, setDetails] = useState(false);

  useEffect(() => {
    getConfigDetails(props.id).then(details => {
      setDetails(details);
    });
  }, [props]);

  return (
    <div>
      {details ? (
        <div>
          <div className={styles.header}>
            <h4>{details.name}</h4>
            {details.active ? (
              <span className={`${styles.badge} ${styles.active}`}>Active</span>
            ) : (
              <span className={`${styles.badge} ${styles.inactive}`}>Not Active</span>
            )}
            <div>
              <div className={styles.toggleButton} onClick={() => console.log("Toggle active")}>
                Toggle Active
              </div>
            </div>
          </div>
          <div className={styles.recordsSection}>
            <RecordsList records={details.records} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default ConfigDetails;
