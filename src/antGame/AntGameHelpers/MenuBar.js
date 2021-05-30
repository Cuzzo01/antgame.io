import GameMenu from "./GameMenu";
import TimeCounter from "./TimeCounter";
import BrushMenu from "./BrushMenu";
import OptionsMenu from "./OptionsMenu/OptionsMenu";

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
      <div style={{ textAlign: "right" }}>
        <BrushMenu
          styles={{ display: "inline" }}
          playState={props.playState}
          brushSizeHandler={props.brushSizeHandler}
          brushTypeHandler={props.brushTypeHandler}
        />
        <OptionsMenu
          playState={props.playState}
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
  container: {
    display: "grid",
    gridTemplateColumns: "15em auto 250px",
  },
};
