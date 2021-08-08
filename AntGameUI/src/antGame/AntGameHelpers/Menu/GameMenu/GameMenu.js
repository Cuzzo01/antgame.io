import { useContext, useEffect, useState } from "react";

import { PlayIcon, PauseIcon } from "../../Icons";
import UploadMapButton from "../UploadMapButton";
import { GameModeContext } from "../../../GameModeContext";
import ChallengeHandler from "../../../Challenge/ChallengeHandler";
import cssStyles from "./GameMenu.module.css";

export default function GameMenu(props) {
  const [flashReset, setFlashReset] = useState(false);
  const gameMode = useContext(GameModeContext);
  let sandBoxButtons = [];

  useEffect(() => {
    if (flashReset === true) setTimeout(() => setFlashReset(false), 900);
  });

  if (props.mapClear)
    sandBoxButtons.push(
      <UploadMapButton key="upload" styles={styles.button} loadMapHandler={props.loadMapHandler} />
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
        handler={() => {
          const result = props.playButtonHandler(!props.playState);
          if (result === "reset") setFlashReset(true);
        }}
      />
      <SettingButton
        className={flashReset ? cssStyles.flashing : ""}
        text={"Reset"}
        handler={props.resetHandler}
        disabled={props.playState}
      />
      <SettingButton
        key="clear"
        text="Clear"
        handler={props.clearMapHandler}
        disabled={props.playState}
      />
      {ChallengeHandler.records.pr ? (
        <SettingButton
          key="PR"
          text="Load PR"
          handler={props.loadPRHandler}
          disabled={props.playState}
        />
      ) : null}
      {gameMode.mode === "challenge" ? null : sandBoxButtons}
    </div>
  );
}

const SettingButton = props => {
  return (
    <button
      className={props.className}
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
