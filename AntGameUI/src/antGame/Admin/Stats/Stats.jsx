import { useEffect, useState } from "react";
import { getStats } from "../AdminService";
import styles from "./Stats.module.css";
import adminStyles from "../AdminStyles.module.css";

const Stats = props => {
  const [stats, setStats] = useState(false);

  useEffect(() => {
    getStats().then(stats => {
      setStats(stats);
    });
  }, []);

  return (
    <div className={adminStyles.divSection}>
      <h4>Stats</h4>
      {stats !== false ? <StatsDisplay data={stats} /> : null}
    </div>
  );
};

const StatsDisplay = props => {
  const stats = props.data;

  const uniqueUserStats = getStatsRow(stats.uniqueUserStats);
  const newAccountStats = getStatsRow(stats.newAccountStats);
  const runCountStats = getStatsRow(stats.runCountStats);

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

const getStatsRow = stats => {
  let statsRow = [];
  for (const [label, value] of Object.entries(stats)) {
    statsRow.push(<StatCell key={label} label={label} value={value.value} delta={value.delta} />);
  }

  return statsRow;
};

const StatCell = props => {
  const [value, setValue] = useState(props.value);
  const [delta, setDelta] = useState(props.delta);

  useEffect(() => {
    setValue(props.value);
    setDelta(props.delta);
  }, [props.value, props.delta]);

  return (
    <div className={adminStyles.rightAlign}>
      {delta ? <span className={getDeltaLabelClassString(delta)}>{delta}%&nbsp;</span> : null}
      {props.label}:<span className={adminStyles.bold}>{value}</span>
    </div>
  );
};

const getDeltaLabelClassString = delta => {
  let labelClassString = styles.deltaLabel;
  if (delta !== undefined)
    labelClassString += " " + (delta > 0 ? adminStyles.green : adminStyles.red);

  return labelClassString;
};
