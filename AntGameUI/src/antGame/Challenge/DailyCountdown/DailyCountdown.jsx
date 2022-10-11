import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
import Countdown from "react-countdown";
import styles from "./DailyCountdown.module.css";

const DailyCountdown = ({ short = false }) => {
  const [nextNoon, setNextNoon] = useState(false);
  const [delta, setDelta] = useState(false);

  useEffect(() => {
    calculateAndSetDelta();

    const countTo = new Date();
    if (countTo.getUTCHours() >= 12) countTo.setUTCDate(countTo.getUTCDate() + 1);
    countTo.setUTCHours(12);
    countTo.setUTCMinutes(0);
    countTo.setUTCSeconds(0);
    setNextNoon(countTo);
  }, []);

  const calculateAndSetDelta = async () => {
    const curTime = await getCurrentTime();
    const delta = Date.now() - curTime;
    if (Math.abs(delta) > 1000) setDelta(delta);
  };

  const renderer = ({ hours, minutes, seconds, completed }) => {
    let classNames = "";
    if (hours === 0 && minutes < 2) classNames = styles.fastBlinking;
    else if (hours === 0 && minutes < 15) classNames = styles.blinking;
    if (short) {
      let showColon = true;
      let firstValue, secondValue;
      if (hours > 0) {
        firstValue = hours;
        secondValue = minutes;
        showColon = seconds % 2 === 0;
      } else {
        firstValue = minutes;
        secondValue = seconds;
      }
      return (
        <span className={classNames}>
          {firstValue < 10 ? `0${firstValue}` : firstValue}
          {showColon ? ":" : " "}
          {secondValue < 10 ? `0${secondValue}` : secondValue}
        </span>
      );
    } else {
      return (
        <span className={classNames}>
          {hours}:{minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </span>
      );
    }
  };

  const onTimeout = () => {
    setTimeout(() => {
      window.location.reload();
    }, 4000);
  };

  return (
    <span>
      {nextNoon ? (
        <Countdown
          date={nextNoon}
          renderer={renderer}
          onComplete={onTimeout}
          now={() => (delta ? Date.now() - delta : Date.now())}
        />
      ) : null}
    </span>
  );
};
export default DailyCountdown;

const getCurrentTime = async () => {
  return axios.get("/api/time").then(res => res.data.now);
};
