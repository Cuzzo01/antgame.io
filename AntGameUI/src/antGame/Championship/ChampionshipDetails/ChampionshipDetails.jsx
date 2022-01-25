import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LeaderboardRow from "../../Helpers/LeaderboardRow";
import { getChampionshipLeaderboard } from "../ChampionshipService";
import styles from "./ChampionshipDetails.module.css";
import AuthHandler from "../../Auth/AuthHandler";

const ChampionshipDetails = ({}) => {
  const currentUsername = AuthHandler.username;
  const championshipID = useParams().id;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState();
  const [userTable, setUserTable] = useState();

  useEffect(() => {
    getChampionshipLeaderboard(championshipID).then(data => {
      console.log(data);
      setTitle(data.name);
      const leaderboard = data.leaderboard;
      const table = [];
      for (let i = 0; i < leaderboard.length; i++) {
        const user = leaderboard[i];
        table.push(
          <LeaderboardRow
            ownRow={user.username === currentUsername}
            key={user.username}
            rank={i + 1}
            name={user.username}
            pb={`${user.points} pts`}
          />
        );
      }
      setUserTable(table);
      setLoading(false);
    });
  }, [championshipID, currentUsername]);

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
          <a href={`/challenge/daily`}>Play Daily</a>
        </div>
      </div>
      {userTable}
    </div>
  );
};
export default ChampionshipDetails;