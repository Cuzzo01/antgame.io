import { Config } from "../../../config";
import styles from "./HomeTracker.module.css";

const MaxHome = Config.Challenge.HomeCellsAllowed;

const HomeTracker = (props) => {
  return (
    <div className={styles.container}>
      <h5 className={props.greyedOut ? styles.greyedOut : ""}>
        Home: {props.homeOnMap}/{MaxHome}
      </h5>
    </div>
  );
};
export default HomeTracker;
