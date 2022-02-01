import styles from "./GenericStyles.module.css";

const Footer = () => {
  return (
    <div className={styles.footerContainer}>
      <hr />
      <span>
        Questions/Feedback/Bugs: <a href="mailto:hi@antgame.io">hi@antgame.io</a>
      </span>
    </div>
  );
};
export default Footer;
