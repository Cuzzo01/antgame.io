import { useEffect, useState } from "react";
import { MenuIcon } from "../Icons";

import "./OptionsMenu.css";

const OptionsMenu = (props) => {
  const [showMenu, setShowMenu] = useState();

  useEffect(() => {
    if (props.playState && showMenu) {
      setShowMenu(false);
      props.blockDrawHandler(false);
    } else {
      props.blockDrawHandler(showMenu);
    }
  }, [props, showMenu]);

  const MenuRow = (props) => {
    return (
      <div className="menu-row">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            props.onClick();
            setShowMenu(false);
          }}
        >
          {props.children}
        </a>
      </div>
    );
  };

  const MapNameRow = (props) => {
    const [mapName, setMapName] = useState(props.currentName);

    const CheckIfEnter = (event) => {
      if (event.key === "Enter") SetName();
    };

    const SetName = () => {
      props.setMapNameHandler(mapName);
      setShowMenu(false);
    };

    useEffect(() => {
      if (props.mapName) setMapName(props.mapName);
    }, [props]);

    return (
      <div className="menu-name-input-row">
        <input
          maxLength="15"
          value={mapName}
          type="text"
          onChange={(e) => {
            setMapName(e.target.value);
            props.setMapNameHandler(e.target.value);
          }}
          onKeyDown={CheckIfEnter}
        />
      </div>
    );
  };

  return (
    <div style={props.styles}>
      <Button
        disabled={props.playState}
        onClick={() => {
          props.blockDrawHandler(!showMenu);
          setShowMenu(!showMenu);
        }}
      >
        <MenuIcon color={props.playState ? "lightgrey" : "black"} />
      </Button>

      {showMenu ? (
        <div className="menu">
          <MenuHeader>Map Name</MenuHeader>
          <MapNameRow
            currentName={props.getMapName()}
            setMapNameHandler={props.setMapNameHandler}
          />
          <MenuHeader>Save image of...</MenuHeader>
          <MenuRow onClick={() => props.saveImageHandler("trail")}>
            Trails
          </MenuRow>
          <MenuRow onClick={() => props.saveImageHandler("map")}>Map</MenuRow>
          <MenuRow onClick={() => props.saveImageHandler("map&trail")}>
            Both
          </MenuRow>
          <MenuHeader>Maps</MenuHeader>
          <MenuRow onClick={() => props.loadSampleMapHandler()}>
            Load sample
          </MenuRow>
        </div>
      ) : null}
    </div>
  );
};

const Button = (props) => {
  return (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      className="button"
    >
      {props.children}
    </button>
  );
};

const MenuHeader = (props) => {
  return <div className="menu-header">{props.children}</div>;
};
export default OptionsMenu;
