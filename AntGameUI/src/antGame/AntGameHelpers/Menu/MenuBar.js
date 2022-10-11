import GameMenu from "./GameMenu/GameMenu";
import Timer from "./Timer/Timer";
import BrushMenu from "./BrushMenu/BrushMenu";
import OptionsMenu from "./OptionsMenu/OptionsMenu";
import FoodTracker from "./FoodTracker/FoodTracker";
import HomeTracker from "./HomeTracker/HomeTracker";
import { GameModeContext } from "../../GameModeContext";
import { useContext } from "react";
import styles from "./MenuBar.module.css";
import ChallengeHandler from "../../Challenge/ChallengeHandler";
import HelpButton from "./HelpButton/HelpButton";
import ReplayLabel from "./ReplayLabel/ReplayLabel";

export default function MenuBar({
  playState,
  foodReturned,
  playButtonHandler,
  resetHandler,
  mapClear,
  clearMapHandler,
  loadMapHandler,
  saveMapHandler,
  loadPRHandler,
  time,
  timerActive,
  homeOnMap,
  blockDrawHandler,
  brushSizeHandler,
  brushTypeHandler,
  saveImageHandler,
  setMapNameHandler,
  getMapName,
  replayLabel,
  speed,
  setSpeed,
  toggleShowHistory,
}) {
  const gameMode = useContext(GameModeContext);
  const IsSandbox = gameMode.mode === "sandbox";
  const IsChallenge = gameMode.mode === "challenge";
  const IsReplay = gameMode.mode === "replay";
  const unresetChallengeMode = IsChallenge && foodReturned !== 0;
  const brushDisabled = playState || unresetChallengeMode;

  const challengeStyleBar = IsChallenge || IsReplay;

  return (
    <div className={styles.container}>
      <GameMenu
        playState={playState}
        playButtonHandler={playButtonHandler}
        resetHandler={resetHandler}
        mapClear={mapClear}
        clearMapHandler={clearMapHandler}
        loadMapHandler={loadMapHandler}
        saveMapHandler={saveMapHandler}
        loadPRHandler={loadPRHandler}
        speed={speed}
        setSpeed={setSpeed}
        toggleShowHistory={toggleShowHistory}
      />
      <div className={challengeStyleBar ? styles.challengeMiddle : styles.middle}>
        {challengeStyleBar && (
          <div className={styles.challengeName}>
            <h3>{ChallengeHandler.config.name}</h3>
          </div>
        )}
        {challengeStyleBar && (
          <div className={styles.vertLineContainer}>
            <div />
            <div className={styles.verticalLine}></div>
            <div />
          </div>
        )}
        <div className={challengeStyleBar ? styles.timerChallenge : styles.timer}>
          <Timer time={time} active={timerActive} />
        </div>
        <div className={styles.vertLineContainer}>
          <div />
          <div className={styles.verticalLine}></div>
          <div />
        </div>
        <div className={styles.foodTracker}>
          <FoodTracker
            active={timerActive}
            foodReturned={foodReturned}
            DisplayScore={challengeStyleBar}
          />
        </div>
      </div>
      <div className={styles.justifyRight}>
        {IsChallenge && <HomeTracker homeOnMap={homeOnMap} greyedOut={brushDisabled} />}
        {(IsSandbox || IsChallenge) && (
          <BrushMenu
            disableButtons={brushDisabled}
            brushSizeHandler={brushSizeHandler}
            brushTypeHandler={brushTypeHandler}
          />
        )}
        {IsChallenge && <HelpButton blockDrawHandler={blockDrawHandler} />}
        {IsSandbox && (
          <OptionsMenu
            playState={playState}
            mapNameDisabled={IsChallenge}
            blockDrawHandler={blockDrawHandler}
            saveImageHandler={saveImageHandler}
            loadMapHandler={loadMapHandler}
            setMapNameHandler={setMapNameHandler}
            getMapName={getMapName}
          />
        )}
        {IsReplay && <ReplayLabel label={replayLabel} />}
      </div>
    </div>
  );
}
