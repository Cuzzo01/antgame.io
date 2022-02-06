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

export default function MenuBar(props) {
  const gameMode = useContext(GameModeContext);
  const IsChallenge = gameMode.mode === "challenge";
  const unresetChallengeMode = IsChallenge && props.foodReturned !== 0;
  const brushDisabled = props.playState || unresetChallengeMode;

  return (
    <div className={styles.container}>
      <GameMenu
        playState={props.playState}
        playButtonHandler={props.playButtonHandler}
        resetHandler={props.resetHandler}
        mapClear={props.mapClear}
        clearMapHandler={props.clearMapHandler}
        loadMapHandler={props.loadMapHandler}
        saveMapHandler={props.saveMapHandler}
        loadPRHandler={props.loadPRHandler}
      />
      <div className={IsChallenge ? styles.challengeMiddle : styles.middle}>
        {IsChallenge ? (
          <div className={styles.challengeName}>
            <h3>{ChallengeHandler.config.name}</h3>
          </div>
        ) : null}
        {IsChallenge ? (
          <div className={styles.vertLineContainer}>
            <div />
            <div className={styles.verticalLine}></div>
            <div />
          </div>
        ) : null}
        <div className={IsChallenge ? styles.timerChallenge : styles.timer}>
          <Timer time={props.time} active={props.timerActive} />
        </div>
        <div className={styles.vertLineContainer}>
          <div />
          <div className={styles.verticalLine}></div>
          <div />
        </div>
        <div className={styles.foodTracker}>
          <FoodTracker
            active={props.timerActive}
            foodReturned={props.foodReturned}
            IsChallenge={IsChallenge}
          />
        </div>
      </div>
      <div className={styles.justifyRight}>
        {IsChallenge ? <HomeTracker homeOnMap={props.homeOnMap} greyedOut={brushDisabled} /> : null}
        <BrushMenu
          disableButtons={brushDisabled}
          brushSizeHandler={props.brushSizeHandler}
          brushTypeHandler={props.brushTypeHandler}
        />
        {IsChallenge ? (
          <HelpButton blockDrawHandler={props.blockDrawHandler} />
        ) : (
          <OptionsMenu
            playState={props.playState}
            mapNameDisabled={IsChallenge}
            blockDrawHandler={props.blockDrawHandler}
            saveImageHandler={props.saveImageHandler}
            loadMapHandler={props.loadMapHandler}
            setMapNameHandler={props.setMapNameHandler}
            getMapName={props.getMapName}
          />
        )}
      </div>
    </div>
  );
}
