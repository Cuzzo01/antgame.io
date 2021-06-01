import { PlayIcon, PauseIcon } from "./../Icons";
import UploadMapButton from "./UploadMapButton";

export default function GameMenu(props) {
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
        text={"Clear"}
        handler={props.clearMapHandler}
        disabled={props.playState}
      />
      {props.mapClear ? (
        <UploadMapButton
          styles={styles.button}
          loadMapHandler={props.loadMapHandler}
        />
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
  },
};
