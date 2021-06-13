import { useState } from "react";
import { Config } from "../../../config";
import styles from "./BrushMenu.module.css";

const BrushSizes = Config.brushSizes;

export default function BrushMenu(props) {
  return (
    <div style={props.styles} className={styles.container}>
      <OptionPicker
        options={Config.brushes}
        handler={props.brushTypeHandler}
        defaultIndex={Config.brushTypeDefaultIndex}
        disabled={props.playState}
      />
      <OptionPicker
        handler={props.brushSizeHandler}
        defaultIndex={Config.brushSizeDefaultIndex}
        options={BrushSizes}
        disabled={props.playState}
      />
    </div>
  );
}

function OptionPicker(props) {
  const [currentIndex, setIndex] = useState(props.defaultIndex);

  const optionList = [];
  for (let i = 0; i < props.options.length; i++) {
    const option = props.options[i];
    const optionName = option.shortName;
    const activeOption = i === currentIndex;
    if (props.disabled) {
      optionList.push(
        <div key={option.value} className={`${styles.disabledElement}`}>
          {optionName}
        </div>
      );
    } else {
      optionList.push(
        <div
          key={option.value}
          onClick={() => {
            props.handler(option.value);
            setIndex(i);
          }}
          className={`${styles.menuElement} ${
            activeOption ? styles.active : ""
          }`}
        >
          {optionName}
        </div>
      );
    }
  }

  return (
    <div className={styles.brushMenu}>
      <div className={props.disabled ? styles.disabledList : styles.optionList}>
        {optionList}
      </div>
    </div>
  );
}
