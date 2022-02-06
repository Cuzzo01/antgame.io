import { useState } from "react";
import styles from "./Leaderboard.module.css";
import globalStyles from "../../Helpers/GenericStyles.module.css";

const SolutionImage = ({ path }) => {
  const [showImage, setShowImage] = useState(false);

  return (
    <div className={styles.solutionImageContainer}>
      <div
        className={globalStyles.divButton}
        onClick={() => setShowImage(!showImage)}
      >
        {showImage ? "Hide" : "See WR Setup"}
      </div>
      {showImage ? (
        <div className={styles.solutionImage}>
          <img alt="World record run setup" src={path} />
        </div>
      ) : null}
    </div>
  );
};
export default SolutionImage;
