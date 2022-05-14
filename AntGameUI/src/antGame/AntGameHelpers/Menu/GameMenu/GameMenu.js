import { useContext, useEffect, useState } from "react";

import { PlayIcon, PauseIcon, BackIcon } from "../../Icons";
import UploadMapButton from "../UploadMapButton";
import { GameModeContext } from "../../../GameModeContext";
import ChallengeHandler from "../../../Challenge/ChallengeHandler";
import cssStyles from "./GameMenu.module.css";
import { getFlag } from "../../../Helpers/FlagService";
import { useHistory } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import genericStyles from "../../../Helpers/GenericStyles.module.css";

export default function GameMenu(props) {
  const [flashReset, setFlashReset] = useState(false);
  const [disablePlay, setDisablePlay] = useState(true);
  const gameMode = useContext(GameModeContext);
  const history = useHistory();
  let sandBoxButtons = [];

  useEffect(() => {
    if (flashReset === true) setTimeout(() => setFlashReset(false), 900);
    if (gameMode.mode === "challenge") {
      getFlag("allow-challenge-runs").then(value => {
        if (value === true) setDisablePlay(false);
      });
    } else {
      setDisablePlay(false);
    }
  }, [flashReset, gameMode]);

  if (props.mapClear)
    sandBoxButtons.push(
      <UploadMapButton key="upload" styles={styles.button} loadMapHandler={props.loadMapHandler} />
    );
  else {
    var isInIframe = window.self !== window.top;
    if (isInIframe) {
      sandBoxButtons.push(
        <span data-tip="" data-for={"warning"}>
          <SettingButton key="save" disabled={true} text="Save" />
          <ReactTooltip effect="solid" id={"warning"}>
            Map saving does not work on outside sites. To save maps, visit antgame.io.
          </ReactTooltip>
        </span>
      );
    } else {
      sandBoxButtons.push(
        <SettingButton
          key="save"
          handler={props.saveMapHandler}
          disabled={props.playState}
          text="Save"
        />
      );
    }
  }

  return (
    <div className={cssStyles.justifyLeft}>
      {gameMode.mode === "challenge" ? (
        <SettingButton
          className={props.playState ? cssStyles.disabled : null}
          disabled={props.playState}
          text={<BackIcon />}
          handler={() => {
            history.push({ pathname: "/" });
          }}
        />
      ) : null}
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
      <SettingButton
        className={flashReset ? cssStyles.flashing : ""}
        text={"Reset"}
        handler={props.resetHandler}
        disabled={props.playState}
      />
      {gameMode.mode === "challenge" ? null : sandBoxButtons}
      <SettingButton
        disabled={disablePlay}
        className={cssStyles.playButton}
        text={props.playState ? <PauseIcon /> : <PlayIcon />}
        handler={async () => {
          const result = await props.playButtonHandler(!props.playState);
          if (result === "reset") setFlashReset(true);
        }}
      />
    </div>
  );
}

const SettingButton = ({ handler, className, disabled, text }) => {
  if (disabled) {
    return (
      <span
        className={`${genericStyles.divButton} ${cssStyles.buttonDisabled} ${className}`}
        disabled={disabled}
        style={styles.button}
      >
        {text}
      </span>
    );
  }
  return (
    <span
      className={`${genericStyles.divButton} ${cssStyles.button} ${className}`}
      style={styles.button}
      onClick={() => handler()}
    >
      {text}
    </span>
  );
};

const styles = {
  button: {
    marginLeft: "0.2em",
    borderRadius: "5px",
    padding: "0.25em 0.5em",
    letterSpacing: "-0.05em",
  },
};
