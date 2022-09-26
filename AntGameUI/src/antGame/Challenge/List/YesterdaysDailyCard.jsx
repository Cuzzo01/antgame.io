import { Link } from "react-router-dom";
import styles from "./ChallengePage.module.css";
import AuthHandler from "../../Auth/AuthHandler";
import LeaderboardRow from "../../Helpers/LeaderboardRow";

export const YesterdaysDailyCard = ({ data }) => {
  return (
    <div className={`${styles.bigCard} ${styles.yesterdaysDaily}`}>
      {data && (
        <span>
          <Link to={`/challenge/${data.id}/leaderboard`}>
            <h4>Yesterday's Daily</h4>
          </Link>
          <h5>{data.name}</h5>
          <ChallengeLeaderboard leaderboard={data.leaderboardData} />
        </span>
      )}
    </div>
  );
};

const ChallengeLeaderboard = ({ leaderboard }) => {
  const currentUser = AuthHandler.username;
  let rowList = [];

  let lastRank = 0;
  for (let i = 0; i < leaderboard?.length; i++) {
    const entry = leaderboard[i];

    if (lastRank + 1 !== entry.rank) rowList.push(<div className={styles.bigCardHr} />);
    rowList.push(
      <LeaderboardRow
        id={entry.id}
        ownRow={entry.username === currentUser}
        key={entry.username}
        rank={entry.rank}
        name={entry.username}
        pb={entry.pb}
        skinny
      />
    );
    lastRank = entry.rank;
  }

  return <div className={styles.bigCardLeaderboard}>{rowList}</div>;
};
