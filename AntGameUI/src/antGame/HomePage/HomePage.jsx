import { Link } from "react-router-dom";
import styles from "./HomePage.module.css";
import { useEffect } from "react";

const HomePage = () => {
  useEffect(() => {
    document.title = "AntGame";
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <img
          className={styles.titleImage}
          src={"https://antgame.io/asset/static/background.webp"}
          alt="AntGame.io"
        />
      </div>
      <div className={styles.links}>
        <Link to="/challenge" className={`${styles.link}`}>
          Challenge Mode
        </Link>
        <Link to="/sandbox" className={`${styles.link} ${styles.sandboxLink}`}>
          <span>
            Sandbox Mode
            <br />
            <span className={styles.subtext}>(Map Editor)</span>
          </span>
        </Link>
      </div>
    </div>
  );
};
export default HomePage;
