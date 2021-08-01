import { useEffect, useState } from "react";
import { getConfigList } from "../AdminService";
import styles from "./ConfigList.module.css";
import { Link } from "react-router-dom";

const ConfigList = props => {
  const [activeConfigList, setActiveConfigList] = useState(false);
  const [inactiveConfigList, setInactiveConfigList] = useState(false);

  useEffect(() => {
    getConfigList().then(configs => {
      const activeConfigs = configs.filter(config => config.active === true);
      const inactiveConfigs = configs.filter(config => config.active === false);

      const activeList = generateConfigList(activeConfigs);
      const inactiveList = generateConfigList(inactiveConfigs);

      setActiveConfigList(activeList);
      setInactiveConfigList(inactiveList);
    });
  }, []);

  const generateConfigList = configs => {
    let list = [];
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      list.push(<ConfigListElement theme={i % 2 === 0 ? styles.even : styles.odd} key={config._id} config={config} />);
    }
    return list;
  };

  return (
    <div>
      <h4>Active Configs</h4>
      {activeConfigList ? activeConfigList : null}
      <h4 style={{ "margin-top": "1em" }}>Inactive Configs</h4>
      {inactiveConfigList ? inactiveConfigList : null}
      {}
    </div>
  );
};

const ConfigListElement = props => {
  const config = props.config;
  return (
    <div className={`${styles.listElement} ${props.theme}`}>
      <div>
        <Link to={`/admin/config/${config._id}`}>
          {config.order ? `(${config.order})` : "(-)"} <span className={styles.bold}>{config.name}</span>
        </Link>
      </div>
      {config.record ? (
        <div className={styles.rightAlign}>
          {config.record.score} - <Link to={`/admin/user/${config.record.userID}`}>{config.record.username}</Link>
        </div>
      ) : (
        <div />
      )}
      <div>
        {config.seconds ? config.seconds : "--"}s / {config.homeLimit}H
      </div>
      <div className={`${styles.rightAlign} ${styles.activeBadge}`}>
        {config.active ? (
          <span className={styles.active}>Active</span>
        ) : (
          <span className={styles.inactive}>Not Active</span>
        )}
      </div>
    </div>
  );
};
export default ConfigList;
