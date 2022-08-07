import { useEffect, useState } from "react";
import { getRecentRuns, getRunsByTag } from "../AdminService";
import styles from "./RunsList.module.css";
import adminStyles from "../AdminStyles.module.css";
import { Link } from "react-router-dom";
import AutoRefreshButton from "./AutoRefreshButton";
import Username from "../../User/Username";
import { RefreshIcon } from "../../AntGameHelpers/Icons";
import Countdown from "react-countdown";
import { useCallback } from "react";

const RunsList = () => {
  const [runsList, setRunsList] = useState(false);
  const [updateTime, setUpdateTime] = useState(false);
  const [runType, setRunType] = useState("recent");

  const setRunData = useCallback(runs => {
    let list = [];
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      list.push(
        <RunsListElement
          theme={i % 2 === 0 ? adminStyles.even : adminStyles.odd}
          run={run}
          key={run._id}
        />
      );
    }
    setRunsList(list);
    setUpdateTime(new Date());
  }, []);

  const refreshData = useCallback(
    type => {
      if (!type) type = runType;

      if (runType === "recent") getRecentRuns(15).then(runs => setRunData(runs));
      else if (runType === "tags-pr") getRunsByTag("pr", 15).then(runs => setRunData(runs));
      else if (runType === "tags-wr") getRunsByTag("wr", 15).then(runs => setRunData(runs));
      else if (runType === "tags-fail")
        getRunsByTag("failed verification", 15).then(runs => setRunData(runs));
    },
    [runType, setRunData]
  );

  useEffect(() => {
    document.title = "Runs List";
    refreshData();
  }, [refreshData]);

  return (
    <div className={styles.container}>
      <div className={styles.titleBar}>
        <span>
          <span className={styles.title}>Runs</span>
          {updateTime && (
            <span className={styles.updateTimestamp}>
              <Countdown date={updateTime} overtime renderer={renderer} />
            </span>
          )}
        </span>
        <span>
          <TypeSelect setRunType={type => setRunType(type)} />
          <AutoRefreshButton onRefresh={() => refreshData()} />
          <span
            className={`${adminStyles.divButton} ${styles.refreshButton}`}
            onClick={() => refreshData()}
          >
            <RefreshIcon />
          </span>
        </span>
      </div>
      {runsList ? runsList : null}
    </div>
  );
};
export default RunsList;

const RunsListElement = ({ run, theme }) => {
  const submissionDateTime = new Date(run.submissionTime);
  const [bodyTagStyles, setBodyTagStyles] = useState("");
  const [scoreTagStyles, setScoreTagStyles] = useState("");

  useEffect(() => {
    const tags = run.tags;
    if (tags.find(tag => tag.type === "wr"))
      setScoreTagStyles(`${adminStyles.purpleText} ${adminStyles.bold}`);
    else if (tags.find(tag => tag.type === "pr"))
      setScoreTagStyles(`${adminStyles.greenText} ${adminStyles.bold}`);

    if (tags.find(tag => tag.type === "failed verification" || tag.type === "falsely claimed pb"))
      setBodyTagStyles(adminStyles.redBackground);
    else if (tags.find(tag => tag.type === "random snapshot save"))
      setBodyTagStyles(adminStyles.yellowBackground);
    else if (tags.find(tag => tag.type === "run verified")) setBodyTagStyles(adminStyles.verified);
  }, [run.tags]);

  return (
    <div className={`${styles.runRow} ${theme} ${bodyTagStyles}`}>
      <span className={styles.time}>
        {submissionDateTime.toLocaleDateString()} {submissionDateTime.toLocaleTimeString()}
      </span>
      <span className={adminStyles.leftAlign}>
        {run.userID ? (
          <Username id={run.userID} name={run.username} adminLink showBorder={false} />
        ) : (
          "N/A"
        )}
      </span>
      <span>{run.tags ? run.tags.length : 0}</span>
      <span className={adminStyles.rightAlign}>
        <Link className={scoreTagStyles} to={`/admin/run/${run._id}`}>
          {run.score}
        </Link>
      </span>
      <span className={adminStyles.rightAlign}>
        <Link to={`/admin/config/${run.challengeID}`}>{run.name}</Link>
      </span>
    </div>
  );
};

const TypeSelect = ({ setRunType }) => {
  return (
    <span className={styles.typeSelect}>
      By:&nbsp;
      <select onChange={v => setRunType(v.target.value)}>
        <option value={"recent"} defaultValue>
          Recent
        </option>
        <option value={"tags-pr"}>Tags (PR)</option>
        <option value={"tags-wr"}>Tags (WR)</option>
        <option value={"tags-fail"}>Tags (Rejected)</option>
      </select>
    </span>
  );
};

const renderer = ({ hours, minutes, seconds, completed }) => {
  if (!hours && !minutes) return `${seconds}s old`;
  if (!hours) return `${minutes}m old`;
  return `${hours}h old`;
};
