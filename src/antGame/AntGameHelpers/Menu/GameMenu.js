import { useContext } from "react";

import { PlayIcon, PauseIcon } from "./../Icons";
import UploadMapButton from "./UploadMapButton";
import { GameModeContext } from "../../GameModeContext";

export default function GameMenu(props) {
  const gameMode = useContext(GameModeContext);
  let sandBoxButtons = [];
  if (props.mapClear)
    sandBoxButtons.push(
      <UploadMapButton
        key="upload"
        styles={styles.button}
        loadMapHandler={props.loadMapHandler}
      />
    );
  else
    sandBoxButtons.push(
      <SettingButton
        key="save"
        handler={props.saveMapHandler}
        disabled={props.playState}
        text="Save"
      />
    );

  return (
    <div style={styles.container}>
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
        key="clear"
        text={"Clear"}
        handler={props.clearMapHandler}
        disabled={props.playState}
      />
      {gameMode === "challenge" ? null : sandBoxButtons}
    </div>
  );
}

const SettingButton = (props) => {
  return (
    <button
      disabled={props.disabled}
      style={styles.button}
      onClick={() => props.handler()}
    >
      {props.text}
    </button>
  );
};

const styles = {
  container: {
    textAlign: "left",
  },
  button: {
    marginLeft: "0.2em",
    borderRadius: "5px",
    padding: "0.25em 0.5em",
    letterSpacing: "-0.05em",
  },
};
