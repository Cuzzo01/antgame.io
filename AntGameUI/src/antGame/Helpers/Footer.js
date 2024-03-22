import styles from "./GenericStyles.module.css";
import GitHubLogo from "./graphics/githubLogo.png";
import DiscordLogo from "./graphics/discordLogo.png";

const Footer = () => {
  return (
    <div>
      <hr />
      <div className={styles.footerContainer}>
        <span />
        <div>
          Questions/Feedback/Bugs: <a href="mailto:hi@antgame.io">hi@antgame.io</a>
        </div>
        <div className={styles.links}>
          <a href="https://discord.gg/mNpZdbtPt3" target="_blank" rel="nofollow noreferrer">
            <img src={DiscordLogo} alt="Discord logo" />
          </a>
          <a href="https://github.com/Cuzzo01/antgame.io" target="_blank" rel="noreferrer">
            <img src={GitHubLogo} alt="GitHub logo" />
          </a>
        </div>
      </div>
    </div>
  );
};
export default Footer;
