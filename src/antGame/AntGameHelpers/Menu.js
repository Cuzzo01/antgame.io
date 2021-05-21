import React, { useState, useRef } from "react";

import { Config } from "../config";

export default function Menu(props) {
  let [brushSize, setBrushSize] = useState(Config.brushSizeDefault);
  let [brushType, setBrushType] = useState(
    Config.brushes[Config.brushTypeDefaultIndex].value
  );
  const inputFile = useRef(null);
  const fileReader = new FileReader();
  fileReader.onload = (e) => {
    props.loadMapHandler(JSON.parse(e.target.result));
  };

  const handleMapLoad = (e) => {
    fileReader.readAsText(e.target.files[0], "UTF-8");
    e.target.value = "";
  };

  return (
    <div style={props.style}>
      <input
        disabled={props.playState}
        type="range"
        min={Config.brushMin}
        max={Config.brushMax}
        step="2"
        value={brushSize}
        onChange={(e) => {
          setBrushSize(e.target.value);
          props.brushSizeHandler(e.target.value);
        }}
      />
      <div style={styles.brushSelect}>
        <label style={styles.label}>Brush:</label>
        <select
          disabled={props.playState}
          name="brush"
          value={brushType}
          onChange={(e) => {
            setBrushType(e.target.value);
            props.brushTypeHandler(e.target.value);
          }}
        >
          {brushOptions()}
        </select>
      </div>
      <div style={{ float: "right" }}>
        {props.mapClear ? (
          <button
            disabled={props.playState}
            style={styles.button}
            onClick={() => inputFile.current.click()}
          >
            Load Map
          </button>
        ) : (
          <SettingButton
            handler={props.mapClear ? null : props.saveMapHandler}
            disabled={props.playState}
            text="Save Map"
          />
        )}
        <SettingButton
          disabled={props.playState}
          handler={props.clearMenuHandler}
          text="Clear Map"
        />
        <SettingButton
          disabled={props.playState}
          handler={props.clearTrailHandler}
          text="Clear Trail"
        />
        <SettingButton
          handler={() => {
            props.playButtonHandler(!props.playState);
          }}
          text={props.playState ? "Clear Ants" : "Play"}
        />
      </div>
      <input
        type="file"
        ref={inputFile}
        onChange={handleMapLoad}
        style={{ display: "none" }}
      />
    </div>
  );
}

function SettingButton(props) {
  return (
    <button
      disabled={props.disabled}
      style={styles.button}
      onClick={() => props.handler()}
    >
      {props.text}
    </button>
  );
}

function brushOptions() {
  let toReturn = [];
  let brushes = Config.brushes;

  for (let i = 0; i < brushes.length; i++) {
    let brush = brushes[i];
    toReturn.push(
      <option value={brush.value} key={brush.value}>
        {brush.name}
      </option>
    );
  }

  return toReturn;
}

const styles = {
  brushSelect: {
    display: "inline",
    paddingLeft: "5px",
  },
  label: {
    paddingRight: "5px",
    marginBottom: "0",
  },
  button: {
    marginLeft: "5px",
  },
};
