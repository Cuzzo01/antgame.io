import { Link } from "react-router-dom";
import { HomeIcon, TimeIcon } from "../../AntGameHelpers/Icons";
import Username from "../../User/Username";
import styles from "./ChallengePage.module.css";

export const WRDisplay = ({ wr }) => {
  if (wr?.score) {
    const wrUsernameLength = wr.username.length;
    return (
      <span>
        {wr.score}-<Username id={wr.id} name={wr.username} />
        {wrUsernameLength < 8 ? (
          <span className={`${styles.smallText} ${styles.age}`}>({wr.age} ago)</span>
        ) : null}
        {wrUsernameLength >= 8 && wrUsernameLength < 12 ? (
          <span className={`${styles.smallText} ${styles.age}`}>({wr.age})</span>
        ) : null}
      </span>
    );
  }
  return "No record";
};

export const PBDisplay = ({ pb, rank, runs }) => {
  if (pb) {
    return (
      <span>
        {pb}
        {(rank < 1000 || runs < 100) && " "}(
        {rank && (
          <span>
            #<strong>{rank}</strong>,&nbsp;
          </span>
        )}
        {runs} run{runs > 1 && "s"})
      </span>
    );
  }
  return "No record";
};

export const ChallengeDetails = ({ time, homes }) => {
  return (
    <div className={styles.challengeDetails}>
      <div>
        <TimeIcon />
        &nbsp;{getDisplayTime(time)}
      </div>
      <div>
        <HomeIcon />
        &nbsp;{homes}
      </div>
    </div>
  );
};

export const LeaderboardLink = props => {
  return (
    <Link className={styles.challengeLink} to={`/challenge/${props.id}/leaderboard`}>
      Leaderboard
    </Link>
  );
};

export const ChampionshipLink = props => {
  return (
    <Link className={styles.challengeLink} to={`/championship/${props.id}`}>
      Championship
    </Link>
  );
};

export const ChallengeLink = ({ id, makeBig }) => {
  let className = styles.challengeLink;
  if (makeBig) className += ` ${styles.bigLink}`;
  return (
    <a href={`/challenge/${id}`} className={className}>
      Play
    </a>
  );
};

export const getDisplayTime = seconds => {
  if (!seconds) return "00:00";
  const min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  if (sec < 10) sec = "0" + sec;
  return `${min}:${sec}`;
};
