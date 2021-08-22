import { useEffect, useState } from "react";
import { getStats } from "../AdminService";
import styles from "./Stats.module.css";

const Stats = props => {
  const [stats, setStats] = useState(false);

  useEffect(() => {
    getStats().then(stats => {
      setStats(stats);
    });
  }, []);

  return (
    <div className={styles.container}>
      <h4>Stats</h4>
      {stats !== false ? <StatsDisplay data={stats} /> : null}
    </div>
  );
};

const StatsDisplay = props => {
  const stats = props.data;

  let uniqueUserStats = [];
  for (const [label, count] of Object.entries(stats.uniqueUserStats)) {
    uniqueUserStats.push(
      <div key={label} className={styles.rightJustify}>
        {label}:<span className={styles.bold}>{count}</span>
      </div>
    );
  }

  let newAccountStats = [];
  for (const [label, count] of Object.entries(stats.newAccountStats)) {
    newAccountStats.push(
      <div key={label} className={styles.rightJustify}>
        {label}:<span className={styles.bold}>{count}</span>
      </div>
    );
  }

  let runCountStats = [];
  for (const [label, count] of Object.entries(stats.runCountStats)) {
    runCountStats.push(
      <div key={label} className={styles.rightJustify}>
        {label}:<span className={styles.bold}>{count}</span>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.uniqueUserStats}>
        <h6>Unique User Logins</h6>
        {uniqueUserStats}
      </div>
      <div className={styles.uniqueUserStats}>
        <h6>New Accounts</h6>
        {newAccountStats}
      </div>
      <div className={styles.uniqueUserStats}>
        <h6>Runs Submitted</h6>
        {runCountStats}
      </div>
    </div>
  );
};

export default Stats;
