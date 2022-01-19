import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getLeaderboard } from "../../Challenge/ChallengeService";
import styles from "./Leaderboard.module.css";
import AuthHandler from "../../Auth/AuthHandler";

const Leaderboard = props => {
  const challengeID = useParams().id;

  const [loading, setLoading] = useState(true);
  const [runTable, setRunData] = useState([]);
  const [title, setTitle] = useState();
  const [playerCount, setPlayerCount] = useState(false);

  useEffect(() => {
    getLeaderboard(challengeID).then(res => {
      const currentUsername = AuthHandler.username;

      if (res === null) {
        setTitle("Error");
        setRunData(<h5>No records for this challenge</h5>);
        setLoading(false);
        return;
      }
      let table = [];
      let lastRank = 0;
      const isDaily = window.location.pathname.includes("daily");
      res.leaderboard.forEach(data => {
        if (data.rank !== lastRank + 1) {
          table.push(<div className={styles.hr} />);
        }
        lastRank = data.rank;
        table.push(
          <LeaderboardRow
            ownRow={data.username === currentUsername}
            key={data.id}
            rank={data.rank}
            name={data.username}
            pb={data.pb}
            age={data.age}
            isDaily={isDaily}
          />
        );
      });
      setRunData(table);
      setTitle(res.name);
      if (res.playerCount) setPlayerCount(res.playerCount);
      document.title = `${res.name} - Leaderboard`;
      setLoading(false);
    });
  }, [challengeID]);

  return loading ? null : (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{title}</h2>
      </div>
      <div className={styles.nav}>
        <div className={styles.navLeft}>
          <Link to="/challenge">Menu</Link>
        </div>
        <div className={styles.navRight}>
          <a href={`/challenge/${challengeID}`}>Play Challenge</a>
        </div>
      </div>
      {runTable}
      {playerCount ? (
        <div>
          <div className={styles.hr} />
          <div className={styles.playerCount}>&nbsp;{playerCount} ranked players</div>
        </div>
      ) : null}
    </div>
  );
};

const LeaderboardRow = ({ rank, ownRow, key, name, age, isDaily, pb }) => {
  let placeStyle = "";
  switch (rank) {
    case 1:
      placeStyle += styles.first;
      break;
    case 2:
      placeStyle += styles.second;
      break;
    case 3:
      placeStyle += styles.third;
      break;
    default:
      break;
  }

  return (
    <div className={`${styles.row} ${placeStyle} ${ownRow ? styles.ownRow : ""}`} key={key}>
      <span className={styles.rank}>#{rank}</span>
      <span>{name}</span>
      <span className={styles.right}>
        <span className={styles.age}>
          {age} {isDaily ? "left" : "ago"}
        </span>
        &nbsp;{pb}
      </span>
    </div>
  );
};
export default Leaderboard;
