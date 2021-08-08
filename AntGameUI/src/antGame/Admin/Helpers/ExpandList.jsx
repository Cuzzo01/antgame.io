import { useEffect, useState } from "react";
import styles from "./ExpandList.module.css";

// Inputs
// props.title
// props.itemsToList - array of jsx elements
// props.emptyMessage - message to display if itemsToList is empty
const ExpandList = props => {
  const [expanded, setExpanded] = useState(false);
  const [list, setList] = useState(false);

  useEffect(() => {
    let list = [];
    if (props.itemsToList) {
      for (let i = 0; i < props.itemsToList.length; i++) {
        list.push(ExpandListElement(props.itemsToList[i]));
      }
    } else {
      list = props.emptyMessage;
    }
    setList(list);
  }, [props.itemsToList]);

  return (
    <div>
      <div className={styles.divButton} onClick={() => setExpanded(!expanded)}>
        {props.title}
      </div>
      {expanded ? <div className={styles.list}>{list}</div> : null}
    </div>
  );
};
export default ExpandList;

const ExpandListElement = listItem => {
  return <div className={styles.listElement}>{listItem}</div>;
};
