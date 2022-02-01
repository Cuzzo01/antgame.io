import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LeaderboardRow from "../../Helpers/LeaderboardRow";
import { getChampionshipLeaderboard } from "../ChampionshipService";
import styles from "./ChampionshipDetails.module.css";
import AuthHandler from "../../Auth/AuthHandler";
import InfoButton from "../InfoButton/InfoButton";

const ChampionshipDetails = ({}) => {
  const currentUsername = AuthHandler.username;
  const championshipID = useParams().id;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState();
  const [userTable, setUserTable] = useState();
  const [pointMap, setPointMap] = useState();

  useEffect(() => {
    getChampionshipLeaderboard(championshipID).then(data => {
      console.log(data);
      setTitle(data.name);
      const leaderboard = data.leaderboard;
      const table = [];
      let lastPoints = 0;
      if (!leaderboard.length) {
        table.push(<div className={styles.emptyMessage}>No points awarded yet</div>);
      } else {
        for (let i = 0; i < leaderboard.length; i++) {
          const user = leaderboard[i];
          const isTied = lastPoints === user.points;
          if (user.noRank) table.push(<div className={styles.hr} />);
          table.push(
            <LeaderboardRow
              ownRow={user.username === currentUsername}
              key={user.username}
              noRank={isTied || user.noRank}
              rank={i + 1}
              name={user.username}
              pb={`${user.points} pts`}
            />
          );
          lastPoints = user.points;
        }
      }
      setPointMap(data.pointMap);
      setUserTable(table);
      setLoading(false);
    });
  }, [championshipID, currentUsername]);

  return loading ? null : (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{title}</h2>
        <InfoButton pointMap={pointMap} />
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
