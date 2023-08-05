import { useContext, useEffect, useState } from "react";

import { PlayIcon, PauseIcon, BackIcon } from "../../Icons";
import UploadMapButton from "../UploadMapButton";
import { GameModeContext } from "../../../GameModeContext";
import ChallengeHandler from "../../../Challenge/ChallengeHandler";
import cssStyles from "./GameMenu.module.css";
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
  const [disablePlay, setDisablePlay] = useState(false);
  const [sandBoxButtons, setSandBoxButtons] = useState(false);
  const gameMode = useContext(GameModeContext);
  const history = useHistory();

  useEffect(() => {
    const buttons = [];
    if (mapClear)
      buttons.push(
        <UploadMapButton
          key="upload"
          className={`${genericStyles.divButton} ${cssStyles.button}`}
          loadMapHandler={loadMapHandler}
        />
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
  }, [gameMode, loadMapHandler, mapClear, playState, saveMapHandler]);

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
      {ChallengeHandler.records.pr && (
        <SettingButton
          text={"History"}
          handler={toggleShowHistory}
          disabled={playState && IsChallenge}
        />
      )}
      <SettingButton text={"Reset"} handler={resetHandler} disabled={playState} />
      {(IsReplay || IsChallenge) && (
        <SettingButton
          key="speed"
          text={`${speed}x`}
          handler={() => {
            if (IsReplay) {
              let newSpeed = speed >= 8 ? 1 : 2 * speed;
              setSpeed(newSpeed);
            } else if (IsChallenge) {
              if (speed !== 1) setSpeed(1);
              else {
                const maxSpeed = Math.floor(ChallengeHandler.config.seconds / 20);
                setSpeed(maxSpeed);
              }
            }
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
          await playButtonHandler(!playState);
          setDisablePlay(false);
        }}
      />
    </div>
  );
}

const SettingButton = ({ handler, className = "", disabled, text }) => {
  const [clickAble, setClickable] = useState(true);

  if (disabled) {
    return (
      <span
        className={`${genericStyles.divButton} ${cssStyles.buttonDisabled} ${cssStyles.button} ${className}`}
        disabled={disabled}
      >
        {text}
      </span>
    );
  }
  return (
    <span
      className={`${genericStyles.divButton} ${cssStyles.button} ${className}`}
      onClick={() => {
        if (clickAble) {
          setClickable(false);
          handler();
          setTimeout(() => setClickable(true), 100);
        }
      }}
      onTouchEnd={e => e.target?.click()}
    >
      {text}
    </span>
  );
};
