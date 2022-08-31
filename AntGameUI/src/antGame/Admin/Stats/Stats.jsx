import { useEffect, useState } from "react";
import { getStats } from "../AdminService";
import styles from "./Stats.module.css";
import adminStyles from "../AdminStyles.module.css";

const Stats = (props) => {
  const [stats, setStats] = useState(false);

  useEffect(() => {
    document.title = "Stats";
    getStats().then((stats) => {
      setStats(stats);
    });
  }, []);

  return (
    <div>
      <h3>Stats</h3>
      {stats !== false ? (
        <div>
          <div className={adminStyles.divSection}>
            <StatsDisplay data={stats} />
          </div>
          <div className={adminStyles.divSection}>
            <CacheDisplay data={stats.serviceCounts} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

const StatsDisplay = ({ data }) => {
  const uniqueUserStats = getStatsRow(data.uniqueUserStats);
  const newAccountStats = getStatsRow(data.newAccountStats);
  const runCountStats = getStatsRow(data.runCountStats);

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

const CacheDisplay = ({ data }) => {
  const seedPercentage = data.seedsOutstanding / 1e8;

  return (
    <div>
      <h5>Counts</h5>
      <span className={styles.cacheRow}>
        <h6>TokenRevoked Cache</h6>
        <div className={adminStyles.rightAlign}>{data.token}</div>
      </span>
      <span className={styles.cacheRow}>
        <h6>Flag Cache</h6>
        <div className={adminStyles.rightAlign}>{data.flag}</div>
      </span>
      <span className={styles.cacheRow}>
        <h6>Leaderboard Cache</h6>
        <div className={adminStyles.rightAlign}>{data.leaderboard}</div>
      </span>
      <span className={styles.cacheRow}>
        <h6>ObjectIdToName Cache</h6>
        <div className={adminStyles.rightAlign}>{data.objectIdToName}</div>
      </span>
      <span className={styles.cacheRow}>
        <h6>User Cache</h6>
        <div className={adminStyles.rightAlign}>{data.user}</div>
      </span>
      <span className={styles.cacheRow}>
        <h6>Outstanding Seeds</h6>
        <div className={adminStyles.rightAlign}>
          {seedPercentage > 0.01 ? (
            <span>({data.seedsOutstanding / 1e8}%)&nbsp;</span>
          ) : null}
          {data.seedsOutstanding}
        </div>
      </span>
    </div>
  );
};

export default Stats;

const getStatsRow = (stats) => {
  let statsRow = [];
  for (const [label, value] of Object.entries(stats)) {
    statsRow.push(
      <StatCell
        key={label}
        label={label}
        value={value.value}
        delta={value.delta}
      />
    );
  }

  return statsRow;
};

const StatCell = (props) => {
  const [value, setValue] = useState(props.value);
  const [delta, setDelta] = useState(props.delta);

  useEffect(() => {
    setValue(props.value);
    setDelta(props.delta);
  }, [props.value, props.delta]);

  return (
    <div className={adminStyles.rightAlign}>
      {delta ? (
        <span className={getDeltaLabelClassString(delta)}>{delta}%&nbsp;</span>
      ) : null}
      {props.label}:<span className={adminStyles.bold}>{value}</span>
    </div>
  );
};

const getDeltaLabelClassString = (delta) => {
  let labelClassString = styles.deltaLabel;
  if (delta !== undefined)
    labelClassString += " " + (delta > 0 ? adminStyles.green : adminStyles.red);

  return labelClassString;
};
