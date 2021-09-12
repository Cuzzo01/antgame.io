import styles from "./RunsList.module.css";
import adminStyles from "../AdminStyles.module.css";
import { useEffect, useRef, useState } from "react";
import Countdown from "react-countdown";

const AutoRefreshButton = props => {
  const [enabled, setEnabled] = useState(false);
  const [nextRefreshTime, setNextRefreshTime] = useState(Date.now);
  const countdownRef = useRef();

  useEffect(() => {
    if (enabled) {
      resetRefreshTime();
      countdownRef.current.getApi().start();
    }
  }, [enabled, countdownRef]);

  const handleTimeout = () => {
    props.onRefresh();
    resetRefreshTime();
    countdownRef.current.getApi().start();
  };

  const resetRefreshTime = () => {
    const date = new Date();
    date.setSeconds(date.getSeconds() + 30);
    setNextRefreshTime(date);
  };

  return (
    <div className={styles.refreshButtonContainer}>
      <span
        className={`${adminStyles.divButton} ${styles.refreshButton} ${
          enabled ? styles.enabled : null
        }`}
        onClick={() => {
          resetRefreshTime();
          setEnabled(!enabled);
        }}
      >
        {enabled ? (
          <Countdown
            ref={countdownRef}
            date={nextRefreshTime}
            onComplete={() => handleTimeout()}
            renderer={renderer}
          />
        ) : (
          "Live"
        )}
      </span>
    </div>
  );
};
export default AutoRefreshButton;

const renderer = ({ hours, minutes, seconds, completed }) => {
  return `${seconds - 1}s`;
};
