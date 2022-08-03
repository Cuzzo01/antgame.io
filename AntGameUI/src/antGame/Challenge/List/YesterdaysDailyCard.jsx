import { Link } from "react-router-dom";
import styles from "./ChallengePage.module.css";
import AuthHandler from "../../Auth/AuthHandler";
import LeaderboardRow from "../../Helpers/LeaderboardRow";

export const YesterdaysDailyCard = ({ data }) => {
  if (!data) return <div></div>;
  return (
    <div className={`${styles.bigCard} ${styles.yesterdaysDaily}`}>
      <Link to={`/challenge/${data.id}/leaderboard`}>
        <h4>Yesterday's Daily</h4>
      </Link>
      <h5>{data.name}</h5>
      <ChallengeLeaderboard leaderboard={data.leaderboardData} />
    </div>
  );
};

const ChallengeLeaderboard = ({ leaderboard }) => {
  const currentUser = AuthHandler.username;
  let rowList = [];

  for (let i = 0; i < leaderboard?.length; i++) {
    const entry = leaderboard[i];

    rowList.push(
      <LeaderboardRow
        id={entry.id}
        ownRow={entry.username === currentUser}
        key={entry.username}
        rank={i + 1}
        name={entry.username}
        pb={entry.pb}
        skinny
      />
    );
  }

  return <div>{rowList}</div>;
};
