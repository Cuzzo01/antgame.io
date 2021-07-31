import { Link } from "react-router-dom";
import styles from "./HomePage.module.css";

const HomePage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <img src="https://antgame.nyc3.cdn.digitaloceanspaces.com/assets/homepage/title.webp" alt="Antgame.io" />
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
