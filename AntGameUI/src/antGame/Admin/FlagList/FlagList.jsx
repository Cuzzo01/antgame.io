import { useState } from "react";
import { useEffect } from "react";
import { getFlagList } from "../AdminService";
import styles from "./FlagList.module.css";
import adminStyles from "../AdminStyles.module.css";

const FlagList = props => {
  const [flagList, setFlagList] = useState([]);

  useEffect(() => {
    document.title = "Flag List";
    getFlagList().then(flags => {
      console.log(flags);

      const flagList = generateFlagList(flags);

      setFlagList(flagList);
    });
  }, []);

  return (
    <div className={styles.container}>
      <h4>Flags</h4>
      {flagList ? flagList : null}
    </div>
  );
};
export default FlagList;

const generateFlagList = flags => {
  const flagList = [];

  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];
    flagList.push(
      <FlagListElement flag={flag} theme={i % 2 === 0 ? adminStyles.even : adminStyles.odd} />
    );
  }
  return flagList;
};

const FlagListElement = props => {
  const { flag, theme } = props;

  let valueDisplay = "";

  switch (flag.type) {
    case "bool":
      valueDisplay = flag.value ? "True" : "False";
      break;
    case "int":
      valueDisplay = flag.value;
      break;
    case "object":
      valueDisplay = "Object";
      break;
    default:
      valueDisplay = "N/A";
  }

  return (
    <div className={`${adminStyles.listElement} ${styles.listElement} ${theme}`}>
      <div className={styles.flagListElementName}>
        <a href={`/admin/flag/${flag._id}`}>{flag.name}</a>
      </div>
      <div className={styles.flagListElementValue}>{valueDisplay}</div>
    </div>
  );
};
