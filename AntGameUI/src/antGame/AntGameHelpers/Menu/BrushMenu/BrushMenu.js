import { useContext, useState } from "react";
import { Config } from "../../../config";
import { GameModeContext } from "../../../GameModeContext";
import ReactTooltip from "react-tooltip";
import styles from "./BrushMenu.module.css";

const BrushSizes = Config.brushSizes;
const HomeBrush = Config.brushes.find(brush => brush.name === "Home");
const EraserBrush = Config.brushes.find(brush => brush.name === "Eraser");
const SmallBrushSize = Config.brushSizes.find(size => size.name === "Small").value;

export default function BrushMenu(props) {
  const gameMode = useContext(GameModeContext);

  let options = [];
  if (gameMode.mode === "challenge") {
    props.brushSizeHandler(SmallBrushSize);
    options.push(
      <OptionPicker
        key="type"
        options={[HomeBrush, EraserBrush]}
        handler={props.brushTypeHandler}
        defaultIndex={0}
        disabled={props.disableButtons}
      />
    );
  } else {
    options.push(
      <OptionPicker
        key="type"
        options={Config.brushes}
        handler={props.brushTypeHandler}
        defaultIndex={Config.brushTypeDefaultIndex}
        disabled={props.disableButtons}
      />
    );
    options.push(
      <OptionPicker
        key="size"
        handler={props.brushSizeHandler}
        defaultIndex={Config.brushSizeDefaultIndex}
        options={BrushSizes}
        disabled={props.disableButtons}
      />
    );
  }

  return (
    <div style={props.styles} className={styles.container}>
      {options}
    </div>
  );
}

function OptionPicker(props) {
  const [currentIndex, setIndex] = useState(props.defaultIndex);

  const optionList = [];
  for (let i = 0; i < props.options.length; i++) {
    const option = props.options[i];
    const optionSymbol = option.shortName;
    const optionName = option.name;
    const activeOption = i === currentIndex;

    const clickHandler = () => {
      props.handler(option.value);
      setIndex(i);
    };

    if (props.disabled) {
      optionList.push(
        <div key={option.value} className={`${styles.disabledElement}`}>
          {optionSymbol}
        </div>
      );
    } else {
      optionList.push(
        <div
          key={option.value}
          className={`${styles.menuElement} ${activeOption ? styles.active : ""}`}
          data-tip
          data-for={optionSymbol}
          data-event="click focus"
        >
          {optionSymbol}
          <ReactTooltip
            place="bottom"
            id={optionSymbol}
            effect="solid"
            className={styles.tooltip}
            afterShow={() => {
              clickHandler();
              setTimeout(ReactTooltip.hide, 1000);
            }}
          >
            {optionName}
          </ReactTooltip>
        </div>
      );
    }
  }

  return (
    <div className={styles.brushMenu}>
      <div className={props.disabled ? styles.disabledList : styles.optionList}>{optionList}</div>
    </div>
  );
}
