import { useEffect, useState } from "react";
import { getFlag } from "./FlagService";
import styles from "./GenericStyles.module.css";
import GitHubLogo from "./githubLogo.png";

const Footer = () => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    getFlag("show-footer").then(res => {
      setShouldShow(res);
    });
  }, []);

  return (
    <div>
      {shouldShow ? (
        <div>
          <hr />
          <div className={styles.footerContainer}>
            <span />
            <div>
              Questions/Feedback/Bugs: <a href="mailto:hi@antgame.io">hi@antgame.io</a>
            </div>
            <div className={styles.githubLink}>
              <a href="https://github.com/Cuzzo01/antgame.io" target="_blank" rel="noreferrer">
                <img src={GitHubLogo} alt="GitHub logo" />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default Footer;
