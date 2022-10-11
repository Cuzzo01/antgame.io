import globalStyles from "../../../Helpers/GenericStyles.module.css";
import styles from "./ReplayLabel.module.css";

export default function ReplayLabel({ label }) {
  return (
    <div className={`${globalStyles.bold} ${styles.text}`}>
      {label}
      {label && " |"} Replay
    </div>
  );
}
