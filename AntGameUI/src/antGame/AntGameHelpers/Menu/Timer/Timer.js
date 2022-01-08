import styles from "./Timer.module.css";

const TimeCounter = props => {
  return (
    <div>
      <Timer active={props.active} time={props.time} />
    </div>
  );
};

const Timer = props => {
  return (
    <h2 className={`${styles.timer} ${props.active ? styles.active : ""}`}>
      {props.time.min}:{props.time.sec}
    </h2>
  );
};
export default TimeCounter;
