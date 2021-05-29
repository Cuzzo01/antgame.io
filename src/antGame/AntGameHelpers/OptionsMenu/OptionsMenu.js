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
  });

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
          <MenuHeader>Save image of...</MenuHeader>
          <MenuRow
            hideMenu={() => setShowMenu(false)}
            onClick={() => props.saveImageHandler("trail")}
          >
            Trails
          </MenuRow>
          <MenuRow
            hideMenu={() => setShowMenu(false)}
            onClick={() => props.saveImageHandler("map")}
          >
            Map
          </MenuRow>
          <MenuRow
            hideMenu={() => setShowMenu(false)}
            onClick={() => props.saveImageHandler("map&trail")}
          >
            Both
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

const MenuRow = (props) => {
  return (
    <div className="menu-row">
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onClick();
          props.hideMenu();
        }}
      >
        {props.children}
      </a>
    </div>
  );
};
export default OptionsMenu;
