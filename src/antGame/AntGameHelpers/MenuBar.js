import GameMenu from "./GameMenu";
import TimeCounter from "./TimeCounter";
import BrushMenu from "./BrushMenu";

export default function MenuBar(props) {
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
      <TimeCounter time={props.time} active={props.timerActive} />
      <BrushMenu
        playState={props.playState}
        brushSizeHandler={props.brushSizeHandler}
        brushTypeHandler={props.brushTypeHandler}
      />
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "15em auto 250px",
  },
};
