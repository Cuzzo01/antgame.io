import { useEffect, useState } from "react";
import { getConfigList } from "../AdminService";
import styles from "./ConfigList.module.css";
import adminStyles from "../AdminStyles.module.css";
import { Link } from "react-router-dom";
import { GetGeneralTimeString } from "../Helpers/FunctionHelpers";
import Username from "../../User/Username";

const ConfigList = props => {
  const [orderConfigList, setOrderConfigList] = useState(false);
  const [noOrderConfigList, setNoOrderConfigList] = useState(false);

  useEffect(() => {
    document.title = "Config List";
    getConfigList().then(configs => {
      const orderConfigs = configs.filter(config => config.order);
      const noOrderConfigs = configs.filter(config => !config.order);

      noOrderConfigs.reverse();

      const orderList = generateConfigList(orderConfigs);
      const noOrderList = generateConfigList(noOrderConfigs.slice(0, 14));

      setOrderConfigList(orderList);
      setNoOrderConfigList(noOrderList);
    });
  }, []);

  return (
    <div>
      <Link to="/admin/newConfig" className={`${styles.newConfigButton} ${adminStyles.bold}`}>
        New Config
      </Link>
      <h3>Ordered Configs</h3>
      {orderConfigList ? orderConfigList : null}
      <h3 style={{ marginTop: "1em" }}>Unordered Configs</h3>
      {noOrderConfigList ? noOrderConfigList : null}
      {}
    </div>
  );
};
export default ConfigList;

const generateConfigList = configs => {
  let list = [];
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    list.push(
      <ConfigListElement theme={i % 2 === 0 ? adminStyles.even : adminStyles.odd} key={config._id} config={config} />
    );
  }
  return list;
};

const ConfigListElement = ({ config, theme }) => {
  return (
    <div className={`${adminStyles.listElement} ${styles.listElement} ${theme}`}>
      <div>
        <Link to={`/admin/config/${config._id}`}>
          {config.order ? `(${config.order})` : "(-)"}&nbsp;
          <span className={adminStyles.bold}>{config.name}</span>
        </Link>
      </div>
      {config.record ? (
        <div className={adminStyles.rightAlign}>
          ({GetGeneralTimeString(config.record.time)})&nbsp;
          <Link to={`/admin/run/${config.record.runID}`}>{config.record.score}</Link> -&nbsp;
          <Username id={config.record.userID} name={config.record.username} adminLink showBorder={false} />
        </div>
      ) : (
        <div />
      )}
      <div>
        {config.seconds ? config.seconds : "--"}s / {config.homeLimit}H
      </div>
      <div className={`${adminStyles.rightAlign} ${styles.activeBadge}`}>
        {config.active ? (
          <span className={styles.active}>{config.playerCount} - Active</span>
        ) : (
          <span className={styles.inactive}>Not Active</span>
        )}
      </div>
    </div>
  );
};
