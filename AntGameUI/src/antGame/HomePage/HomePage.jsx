import { Link } from "react-router-dom";
import styles from "./HomePage.module.css";

const HomePage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <img src="https://antgame.nyc3.cdn.digitaloceanspaces.com/assets/homepage/title.png" alt="Antgame.io" />
      </div>
      <div className={styles.links}>
        <Link to="/challenge" className={`${styles.link}`}>
          Play Challenge Mode
        </Link>
        <Link to="/sandbox" className={`${styles.link}`}>
          Sandbox Mode
          <br />
          <span className={styles.subtext}>(Map Editor)</span>
        </Link>
      </div>
    </div>
  );
};
export default HomePage;
