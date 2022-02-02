import { useEffect, useState } from "react";
import { getFlag } from "./FlagService";
import styles from "./GenericStyles.module.css";

const Footer = () => {
  const [shouldShow, setShouldShow] = useState(false);
  useEffect(() => {
    getFlag("show-footer").then(res => {
      setShouldShow(res);
    });
  });

  return (
    <div>
      {shouldShow ? (
        <div className={styles.footerContainer}>
          <hr />
          <span>
            Questions/Feedback/Bugs: <a href="mailto:hi@antgame.io">hi@antgame.io</a>
          </span>
        </div>
      ) : null}
    </div>
  );
};
export default Footer;
