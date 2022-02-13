import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LeaderboardRow from "../../Helpers/LeaderboardRow";
import { getChampionshipLeaderboard } from "../ChampionshipService";
import styles from "./ChampionshipDetails.module.css";
import AuthHandler from "../../Auth/AuthHandler";
import InfoButton from "../InfoButton/InfoButton";
import { useCallback } from "react";
import genericStyles from "../../Helpers/GenericStyles.module.css";
import Username from "../../User/Username";

const ChampionshipDetails = ({}) => {
  const currentUsername = AuthHandler.username;
  const championshipID = useParams().id;

  const [lastPoints, setLastPoints] = useState(false);
  const [title, setTitle] = useState(false);
  const [userTable, setUserTable] = useState();
  const [pointMap, setPointMap] = useState();

  const setLeaderboard = useCallback(
    ({ leaderboard, usernames }) => {
      const table = [];
      let lastPoints = 0;
      if (!leaderboard.length) {
        table.push(<div className={styles.emptyMessage}>No points awarded yet</div>);
      } else {
        for (let i = 0; i < leaderboard.length; i++) {
          const user = leaderboard[i];
          const username = usernames[user._id];

          const isTied = lastPoints === user.points;
          if (user.noRank) table.push(<div className={styles.hr} />);
          table.push(
            <LeaderboardRow
              id={user._id}
              ownRow={username === currentUsername}
              key={username}
              noRank={isTied || user.noRank}
              rank={i + 1}
              name={username}
              pb={`${user.points} pts`}
            />
          );
          lastPoints = user.points;
        }
      }
      setUserTable(table);
    },
    [currentUsername]
  );

  const setLastPointsAwarded = useCallback(({ lastPointsAwarded, usernames }) => {
    if (!lastPointsAwarded) return;
    const table = [];
    lastPointsAwarded.forEach(user => {
      table.push(
        <div className={styles.lastPointsRow} key={user.userID}>
          <span>
            <Username name={usernames[user.userID]} id={user.userID} />
          </span>
          <span className={genericStyles.right}>{user.points} pts</span>
        </div>
      );
    });
    setLastPoints(table);
  }, []);

  useEffect(() => {
    getChampionshipLeaderboard(championshipID).then(data => {
      setTitle(data.name);
      document.title = `${data.name} - Championship`;
      setPointMap(data.pointMap);
      setLastPointsAwarded(data);
      setLeaderboard(data);
    });
  }, [championshipID, currentUsername, setLastPointsAwarded, setLeaderboard]);

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{title}</h2>
        {pointMap ? <InfoButton pointMap={pointMap} /> : null}
      </div>
      <div className={styles.nav}>
        <div className={styles.navLeft}>
          <Link to="/challenge">Menu</Link>
        </div>
        <div className={styles.navRight}>
          <a href={`/challenge/daily`}>Play Daily</a>
        </div>
      </div>
      <div className={styles.flex}>
        <div className={`${styles.section}`}>
          <h5>Leaderboard</h5>
          <div className={styles.box}>{userTable}</div>
        </div>
        {lastPoints ? (
          <div className={`${styles.section}`}>
            <h5>Yesterday's points</h5>
            <div className={styles.box}>{lastPoints}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
export default ChampionshipDetails;
