import { useEffect, useState } from "react";
import { getConfigList } from "../AdminService";
import styles from "./ConfigList.module.css";
import { Link } from "react-router-dom";

const ConfigList = props => {
  const [configList, setConfigList] = useState(false);

  useEffect(() => {
    getConfigList().then(configs => {
      let list = [];
      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        list.push(<ConfigListElement key={config._id} config={config} />);
      }
      setConfigList(list);
    });
  }, []);

  return (
    <div>
      <h4>Configs</h4>
      {configList ? configList : null}
    </div>
  );
};

const ConfigListElement = props => {
  const config = props.config;
  return (
    <div className={styles.listElement}>
      <div>
        <Link to={`/admin/config/${config._id}`}>
          {config.order ? `(${config.order})` : "(-)"} {config.name}
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
      <div />
    </div>
  );
};
export default ConfigList;
