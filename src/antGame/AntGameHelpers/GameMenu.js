import { PlayIcon, PauseIcon } from "./Icons";
import { useRef } from "react";

export default function GameMenu(props) {
  const inputFile = useRef(null);
  const fileReader = new FileReader();
  fileReader.onload = (e) => {
    props.loadMapHandler(JSON.parse(e.target.result));
  };

  const handleMapLoad = (e) => {
    fileReader.readAsText(e.target.files[0], "UTF-8");
    e.target.value = "";
  };

  return (
    <div style={styles.container}>
      <input
        type="file"
        ref={inputFile}
        onChange={handleMapLoad}
        style={{ display: "none" }}
      />
      <SettingButton
        text={props.playState ? <PauseIcon /> : <PlayIcon />}
        handler={() => props.playButtonHandler(!props.playState)}
      />
      <SettingButton
        text={"Reset"}
        handler={props.resetHandler}
        disabled={props.playState}
      />
      <SettingButton
        text={"Clear"}
        handler={props.clearMapHandler}
        disabled={props.playState}
      />
      {props.mapClear ? (
        <button
          disabled={props.playState}
          style={styles.button}
          onClick={() => inputFile.current.click()}
        >
          Load
        </button>
      ) : (
        <SettingButton
          handler={props.saveMapHandler}
          disabled={props.playState}
          text="Save"
        />
      )}
    </div>
  );
}

function SettingButton(props) {
  return (
    <button
      disabled={props.disabled}
      style={styles.button}
      onClick={() => props.handler()}
    >
      {props.text}
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
    textAlign: "left",
  },
  button: {
    marginLeft: "0.2em",
    borderRadius: "5px",
    padding: "0.25em 0.5em",
  },
};
