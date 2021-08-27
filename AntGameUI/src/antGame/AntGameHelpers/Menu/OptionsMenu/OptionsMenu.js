import { useEffect, useState, useRef, useContext } from "react";
import { MenuIcon } from "../../Icons";
import { GameModeContext } from "../../../GameModeContext";
import AuthHandler from "../../../Auth/AuthHandler";

import styles from "./OptionsMenu.module.css";

const OptionsMenu = props => {
  const [showMenu, setShowMenu] = useState();
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const gameMode = useContext(GameModeContext);
  const IsChallengeMode = gameMode.mode === "challenge";

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
      const clickOnButton = buttonCurrent && buttonCurrent.contains(event.target);
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

  const getMenuCallback = callback => {
    return () => {
      callback();
      setShowMenu(false);
    };
  };

  return (
    <div className={styles.container}>
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
        <div className={styles.menu} ref={menuRef}>
          <MenuHeader>Map Name</MenuHeader>
          <MapNameRow
            currentName={props.getMapName()}
            setMapNameHandler={props.setMapNameHandler}
            setShowMenu={setShowMenu}
            disabled={props.mapNameDisabled}
          />
          <MenuHeader>Save image of...</MenuHeader>
          <MenuRow onClick={getMenuCallback(() => props.saveImageHandler("trail"))}>Trails</MenuRow>
          <MenuRow onClick={getMenuCallback(() => props.saveImageHandler("map"))}>Map</MenuRow>
          <MenuRow onClick={getMenuCallback(() => props.saveImageHandler("map&trail"))}>
            Both
          </MenuRow>
          <MenuHeader>Maps</MenuHeader>
          <MenuRow onClick={getMenuCallback(() => props.loadMapHandler("sample"))}>
            Load sample
          </MenuRow>
          {AuthHandler.isAdmin ? (
            <div>
              <MenuRow onClick={getMenuCallback(() => props.loadMapHandler("generated"))}>
                Generate Map
              </MenuRow>
            </div>
          ) : null}
          <MenuHeader styles={{ fontSize: "0.8em" }}>Feedback & Map Submissions:</MenuHeader>
          <MenuRow
            onClick={getMenuCallback(() => (window.location = "mailto:feedback@antgame.io"))}
          >
            feedback@antgame.io
          </MenuRow>
        </div>
      ) : null}
    </div>
  );
};

const MapNameRow = props => {
  const [mapName, setMapName] = useState(props.currentName);

  const CheckIfEnter = event => {
    if (event.key === "Enter") SetName();
  };

  const SetName = () => {
    props.setMapNameHandler(mapName);
    props.setShowMenu(false);
  };

  useEffect(() => {
    if (props.mapName) setMapName(props.mapName);
  }, [props.mapName]);

  return (
    <div className={styles.menuNameInputRow}>
      <input
        maxLength="15"
        value={mapName}
        type="text"
        onChange={e => {
          setMapName(e.target.value);
          props.setMapNameHandler(e.target.value);
        }}
        onKeyDown={CheckIfEnter}
        disabled={props.disabled}
      />
    </div>
  );
};

const MenuRow = props => {
  return (
    <div className={styles.menuRow}>
      <a
        href="/"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          props.onClick();
        }}
      >
        {props.children}
      </a>
    </div>
  );
};

const Button = props => {
  return (
    <button
      ref={props.reference}
      disabled={props.disabled}
      onClick={props.onClick}
      className={styles.button}
    >
      {props.children}
    </button>
  );
};

const MenuHeader = props => {
  return (
    <div className={styles.menuHeader} style={props.styles}>
      {props.children}
    </div>
  );
};
export default OptionsMenu;
