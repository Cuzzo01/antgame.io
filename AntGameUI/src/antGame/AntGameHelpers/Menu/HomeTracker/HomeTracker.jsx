import { useEffect, useState } from "react";
import ChallengeHandler from "../../../Challenge/ChallengeHandler";
import styles from "./HomeTracker.module.css";

const HomeTracker = (props) => {
  const [loading, setLoading] = useState(true);
  const [maxHome, setMaxHome] = useState();

  useEffect(() => {
    ChallengeHandler.getConfig().then((config) => {
      setMaxHome(config.homeLimit);
      setLoading(false);
    });
  }, []);

  return (
    <div className={styles.container}>
      {loading ? (
        <div />
      ) : (
        <h5 className={props.greyedOut ? styles.greyedOut : ""}>
          Home: {props.homeOnMap}/{maxHome}
        </h5>
      )}
    </div>
  );
};
export default HomeTracker;
