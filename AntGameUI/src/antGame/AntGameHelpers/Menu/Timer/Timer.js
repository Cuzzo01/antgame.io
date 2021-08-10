import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Timer.module.css";

const TimeCounter = props => {
  const [hasLink, setHasLink] = useState(false);
  const [linkPath, setLinkPath] = useState("");

  useEffect(() => {
    const path = window.location.pathname;
    const shouldLinkToSandbox = path.startsWith("/map");
    const shouldLinkToChallengePage = path.startsWith("/challenge/");

    setHasLink(shouldLinkToSandbox || shouldLinkToChallengePage);

    if (shouldLinkToSandbox) setLinkPath("/sandbox");
    else if (shouldLinkToChallengePage) setLinkPath("/challenge");
  }, []);

  return (
    <div>
      {hasLink && !props.active ? (
        <Link className={styles.link} to={linkPath}>
          <Timer active={props.active} time={props.time} />
        </Link>
      ) : (
        <Timer active={props.active} time={props.time} />
      )}
    </div>
  );
};

const Timer = props => {
  return (
    <h2 className={`${styles.timer} ${props.active ? styles.active : ""}`}>
      {props.time.min}:{props.time.sec}
    </h2>
  );
};
export default TimeCounter;
