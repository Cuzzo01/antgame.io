import { useEffect, useState, useRef, useContext } from "react";
import { MenuIcon } from "../../Icons";
import { GameModeContext } from "../../../GameModeContext";

import "./OptionsMenu.css";

const OptionsMenu = (props) => {
  const [showMenu, setShowMenu] = useState();
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const gameMode = useContext(GameModeContext);
  const IsChallengeMode = gameMode === "challenge";

  useEffect(() => {
    if (props.playState && showMenu) {
      setShowMenu(false);
      props.blockDrawHandler(false);
    } else {
      props.blockDrawHandler(showMenu);
    }
  }, [props, showMenu]);

  useEffect(() => {
    function handleClickOutside(event) {
      const menuCurrent = menuRef.current;
      const buttonCurrent = menuButtonRef.current;
      const clickInMenu = menuCurrent && menuCurrent.contains(event.target);
      const clickOnButton =
        buttonCurrent && buttonCurrent.contains(event.target);
      if (!clickInMenu && !clickOnButton) {
        setShowMenu(false);
        props.blockDrawHandler(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef, menuButtonRef, props]);

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
        reference={menuButtonRef}
        disabled={props.playState}
        onClick={() => {
          props.blockDrawHandler(!showMenu);
          setShowMenu(!showMenu);
        }}
      >
        <MenuIcon color={props.playState ? "lightgrey" : "black"} />
      </Button>

      {showMenu ? (
        <div className="menu" ref={menuRef}>
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
          {!IsChallengeMode ? (
            <div>
              <MenuHeader>Maps</MenuHeader>
              <MenuRow onClick={() => props.loadSampleMapHandler()}>
                Load sample
              </MenuRow>
            </div>
          ) : null}
          <MenuHeader styles={{ fontSize: "0.85em" }}>
            Feedback & Sample Maps:
          </MenuHeader>
          <MenuRow
            onClick={() => (window.location = "mailto:feedback@antgame.io")}
          >
            feedback@antgame.io
          </MenuRow>
        </div>
      ) : null}
    </div>
  );
};

const Button = (props) => {
  return (
    <button
      ref={props.reference}
      disabled={props.disabled}
      onClick={props.onClick}
      className="button"
    >
      {props.children}
    </button>
  );
};

const MenuHeader = (props) => {
  return (
    <div className="menu-header" style={props.styles}>
      {props.children}
    </div>
  );
};
export default OptionsMenu;
