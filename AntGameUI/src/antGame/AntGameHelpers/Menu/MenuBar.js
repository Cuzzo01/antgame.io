import GameMenu from "./GameMenu/GameMenu";
import TimeCounter from "./Timer/Timer";
import BrushMenu from "./BrushMenu/BrushMenu";
import OptionsMenu from "./OptionsMenu/OptionsMenu";
import FoodTracker from "./FoodTracker/FoodTracker";
import HomeTracker from "./HomeTracker/HomeTracker";
import { GameModeContext } from "../../GameModeContext";
import { useContext } from "react";

export default function MenuBar(props) {
  const gameMode = useContext(GameModeContext);
  const IsChallenge = gameMode.mode === "challenge";
  const unresetChallengeMode = IsChallenge && props.foodReturned !== 0;
  const brushDisabled = props.playState || unresetChallengeMode;

  return (
    <div style={styles.container}>
      <GameMenu
        playState={props.playState}
        playButtonHandler={props.playButtonHandler}
        resetHandler={props.resetHandler}
        mapClear={props.mapClear}
        clearMapHandler={props.clearMapHandler}
        loadMapHandler={props.loadMapHandler}
        saveMapHandler={props.saveMapHandler}
      />
      <div style={styles.middle}>
        <TimeCounter
          time={props.time}
          active={props.timerActive}
          styles={styles.timer}
        />
        <FoodTracker
          active={props.timerActive}
          styles={styles.foodTracker}
          foodReturned={props.foodReturned}
        />
      </div>
      <div style={{ textAlign: "right" }}>
        {IsChallenge ? (
          <HomeTracker homeOnMap={props.homeOnMap} greyedOut={brushDisabled} />
        ) : null}
        <BrushMenu
          styles={{ display: "inline-block" }}
          disableButtons={brushDisabled}
          brushSizeHandler={props.brushSizeHandler}
          brushTypeHandler={props.brushTypeHandler}
        />
        <OptionsMenu
          playState={props.playState}
          mapNameDisabled={IsChallenge}
          blockDrawHandler={props.blockDrawHandler}
          saveImageHandler={props.saveImageHandler}
          loadSampleMapHandler={props.loadSampleMapHandler}
          setMapNameHandler={props.setMapNameHandler}
          getMapName={props.getMapName}
          styles={{ display: "inline" }}
        />
      </div>
    </div>
  );
}

const styles = {
  foodTracker: {
    textAlign: "left",
    paddingLeft: "0.4em",
  },
  timer: {
    textAlign: "right",
    paddingRight: "0.5em",
    borderRight: "3px solid black",
  },
  middle: {
    display: "grid",
    gridTemplateColumns: "50% 50%",
  },
  container: {
    display: "grid",
    gridTemplateColumns: "19em auto 19em",
    alignItems: "center",
  },
};
