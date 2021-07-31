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
  console.log(stats.loginStats);

  let loginStats = [];
  for (const [hours, users] of Object.entries(stats.loginStats)) {
    loginStats.push(
      <div key={hours} className={styles.rightJustify}>
        {hours}hr - <span className={styles.bold}>{users}</span>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.loginStats}>
        <h6>Unique Users</h6>
        {loginStats}
      </div>
    </div>
  );
};

export default Stats;
