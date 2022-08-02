import LeaderboardRow from "../../Helpers/LeaderboardRow";
import styles from "./ChallengePage.module.css";
import AuthHandler from "../../Auth/AuthHandler";
import { Link } from "react-router-dom";

export const ChampionshipCard = ({ championshipData }) => {
  if (!championshipData) return <div></div>;
  return (
    <div className={`${styles.bigCard} ${styles.championshipCard}`}>
      <span>
        <Link to={`/championship/${championshipData.id}`}>
          <h4>{championshipData.name}</h4>
        </Link>
        <h5>Championship</h5>
      </span>
      <ChampionshipLeaderboard leaderboard={championshipData.leaderboard} />
    </div>
  );
};

const ChampionshipLeaderboard = ({ leaderboard }) => {
  const currentUser = AuthHandler.username;
  let rowList = [];

  let lastPoints = 0;
  for (let i = 0; i < leaderboard?.length; i++) {
    const entry = leaderboard[i];
    console.log(entry);

    const isTied = lastPoints === entry.points;
    rowList.push(
      <LeaderboardRow
        id={entry._id}
        ownRow={entry.username === currentUser}
        key={entry.username}
        noRank={isTied}
        rank={i + 1}
        name={entry.username}
        pb={`${entry.points} pts`}
        skinny
      />
    );
    lastPoints = entry.points;
  }

  return <div>{rowList}</div>;
};
