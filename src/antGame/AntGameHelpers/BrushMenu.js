import { useState } from "react";
import { Config } from "../config";

export default function BrushMenu(props) {
  return (
    <div style={styles.container}>
      <BrushButton
        options={Config.brushes}
        handler={props.brushTypeHandler}
        defaultIndex={Config.brushTypeDefaultIndex}
      />
      <BrushButton
        handler={props.brushSizeHandler}
        defaultIndex={Config.brushSizeDefaultIndex}
        options={Config.brushSizes}
      />
    </div>
  );
}

function BrushButton(props) {
  const [currentIndex, setIndex] = useState(props.defaultIndex);
  return (
    <button
      disabled={props.disabled}
      style={styles.button}
      onClick={() => {
        let nextIndex = currentIndex + 1;
        if (nextIndex === props.options.length) nextIndex = 0;
        props.handler(props.options[nextIndex].value);
        setIndex(nextIndex);
      }}
    >
      {props.options[currentIndex].name}
    </button>
  );
}

const styles = {
  // brushSelect: {
  //   display: "inline",
  //   paddingLeft: "5px",
  // },
  // label: {
  //   paddingRight: "5px",
  //   marginBottom: "0",
  // },
  container: {
    textAlign: "right",
  },
  button: {
    marginRight: "0.2em",
    borderRadius: "5px",
    padding: "0.25em 0.5em",
    minWidth: "2.5em",
  },
};
