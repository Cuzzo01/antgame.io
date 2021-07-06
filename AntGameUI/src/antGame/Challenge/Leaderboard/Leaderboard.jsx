import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLeaderboard } from "../../AntGameHelpers/Services/ChallengeService";
import styles from "./Leaderboard.module.css";

const Leaderboard = (props) => {
  const challengeID = useParams().id;

  const [loading, setLoading] = useState(true);
  const [runTable, setRunData] = useState([]);
  const [title, setTitle] = useState();

  useEffect(() => {
    getLeaderboard(challengeID).then((res) => {
      let table = [];
      let count = 1;
      res.leaderboard.forEach((data) => {
        table.push(
          <LeaderboardRow
            key={data.id}
            rank={count}
            name={data.username}
            pb={data.pb}
          />
        );
        count++;
      });
      setRunData(table);
      setTitle(res.name);
      setLoading(false);
    });
  }, [challengeID]);

  return loading ? null : (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{title}</h2>
      </div>
      {runTable}
    </div>
  );
};

const LeaderboardRow = (props) => {
  return (
    <div className={styles.row}>
      <span className={styles.rank}>#{props.rank}</span>
      <span>{props.name}</span>
      <span className={styles.score}>{props.pb}</span>
    </div>
  );
};
export default Leaderboard;
