import { useHistory } from "react-router-dom";
import "./Timer.css";

const TimeCounter = (props) => {
  const path = window.location.pathname;
  const shouldLinkHome = path.startsWith("/map");
  const shouldLinkToChallengePage = path.startsWith("/challenge/");
  const history = useHistory();

  const hasLink = shouldLinkHome || shouldLinkToChallengePage;
  let linkPath = "";

  if (shouldLinkHome) linkPath = "/";
  else if (shouldLinkToChallengePage) linkPath = "/challenge";
  const handleLinkClick = (e) => {
    e.preventDefault();
    if (shouldLinkHome) history.push("/");
    if (shouldLinkToChallengePage) history.push("/challenge");
  };

  return (
    <div style={props.styles}>
      {hasLink && !props.active ? (
        <div>
          <a href={linkPath} alt="Test" onClick={(e) => handleLinkClick(e)}>
            <Timer active={props.active} time={props.time} />
          </a>
        </div>
      ) : (
        <Timer active={props.active} time={props.time} />
      )}
    </div>
  );
};

const Timer = (props) => {
  return (
    <h2 className={`timer ${props.active ? "active" : ""}`}>
      {props.time.min}:{props.time.sec}
    </h2>
  );
};
export default TimeCounter;
