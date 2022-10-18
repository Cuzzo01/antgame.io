import { useContext, useEffect, useState } from "react";
import { isMobile } from "react-device-detect";

import { PlayIcon, PauseIcon, BackIcon } from "../../Icons";
import UploadMapButton from "../UploadMapButton";
import { GameModeContext } from "../../../GameModeContext";
import ChallengeHandler from "../../../Challenge/ChallengeHandler";
import cssStyles from "./GameMenu.module.css";
import { getFlag } from "../../../Helpers/FlagService";
import { useHistory } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import genericStyles from "../../../Helpers/GenericStyles.module.css";

export default function GameMenu({
  mapClear,
  loadMapHandler,
  saveMapHandler,
  playState,
  clearMapHandler,
  loadRecordHandler,
  resetHandler,
  playButtonHandler,
  speed,
  setSpeed,
  toggleShowHistory,
}) {
  const [flashReset, setFlashReset] = useState(false);
  const [disablePlay, setDisablePlay] = useState(true);
  const [sandBoxButtons, setSandBoxButtons] = useState(false);
  const gameMode = useContext(GameModeContext);
  const history = useHistory();

  useEffect(() => {
    if (flashReset === true) setTimeout(() => setFlashReset(false), 900);
    if (gameMode.mode === "challenge") {
      getFlag("allow-challenge-runs").then(value => {
        if (value === true) setDisablePlay(false);
      });
    } else {
      setDisablePlay(false);
    }

    const buttons = [];
    if (mapClear)
      buttons.push(
        <UploadMapButton key="upload" styles={styles.button} loadMapHandler={loadMapHandler} />
      );
    else {
      var isInIframe = window.self !== window.top;
      if (isInIframe) {
        buttons.push(
          <span data-tip="" data-for={"warning"}>
            <SettingButton key="save" disabled={true} text="Save" />
            <ReactTooltip effect="solid" id={"warning"}>
              Map saving does not work on outside sites. To save maps, visit antgame.io.
            </ReactTooltip>
          </span>
        );
      } else {
        buttons.push(
          <SettingButton key="save" handler={saveMapHandler} disabled={playState} text="Save" />
        );
      }
    }
    setSandBoxButtons(buttons);
  }, [flashReset, gameMode, loadMapHandler, mapClear, playState, saveMapHandler]);

  const IsChallenge = gameMode.mode === "challenge";
  const IsReplay = gameMode.mode === "replay";
  const IsSandbox = gameMode.mode === "sandbox";
  return (
    <div className={cssStyles.justifyLeft}>
      {(IsChallenge || IsReplay) && (
        <SettingButton
          className={playState ? cssStyles.disabled : null}
          disabled={playState}
          text={<BackIcon />}
          handler={() => {
            if (IsChallenge) history.push({ pathname: "/" });
            else history.goBack();
          }}
        />
      )}
      {!IsReplay && (
        <SettingButton key="clear" text="Clear" handler={clearMapHandler} disabled={playState} />
      )}
      {(ChallengeHandler.records.pr || ChallengeHandler.config.prData) && (
        <SettingButton
          key="PR"
          text="Load PR"
          handler={() => loadRecordHandler("pr")}
          disabled={playState}
        />
      )}
      {ChallengeHandler.config.wrData && (
        <SettingButton
          key="WR"
          text="Load WR"
          handler={() => loadRecordHandler("wr")}
          disabled={playState}
        />
      )}
      {!isMobile && ChallengeHandler.records.pr && (
        <SettingButton
          text={"History"}
          handler={toggleShowHistory}
          disabled={playState && IsChallenge}
        />
      )}
      <SettingButton
        className={flashReset ? cssStyles.flashing : ""}
        text={"Reset"}
        handler={resetHandler}
        disabled={playState}
      />
      {IsReplay && (
        <SettingButton
          key="speed"
          text={`${speed}x`}
          handler={() => {
            const newSpeed = 2 * speed;
            if (newSpeed > 8) setSpeed(1);
            else setSpeed(newSpeed);
          }}
        />
      )}
      {IsSandbox && sandBoxButtons}
      <SettingButton
        disabled={disablePlay}
        className={cssStyles.playButton}
        text={playState ? <PauseIcon /> : <PlayIcon />}
        handler={async () => {
          setDisablePlay(true);
          const result = await playButtonHandler(!playState);
          setDisablePlay(false);
          if (result === "reset") setFlashReset(true);
        }}
      />
    </div>
  );
}

const SettingButton = ({ handler, className, disabled, text }) => {
  const [clickAble, setClickable] = useState(true);

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
      onClick={() => {
        if (clickAble) {
          setClickable(false);
          handler();
          setTimeout(() => setClickable(true), 100);
        }
      }}
      onTouchEnd={e => e.target.click()}
    >
      {text}
    </span>
  );
};

const styles = {
  button: {
    marginLeft: "0.2rem",
    borderRadius: "5px",
    padding: "0.25rem 0.5rem",
    letterSpacing: "-0.05rem",
  },
};
