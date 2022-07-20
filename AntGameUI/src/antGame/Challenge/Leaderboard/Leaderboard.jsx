import { useEffect, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { getLeaderboard, getPublicLeaderboard } from "../../Challenge/ChallengeService";
import styles from "./Leaderboard.module.css";
import AuthHandler from "../../Auth/AuthHandler";
import DailyChallengePicker from "./DailyChallengePicker";
import { useCallback } from "react";
import LeaderboardRow from "../../Helpers/LeaderboardRow";
import SolutionImage from "./SolutionImage";

const Leaderboard = props => {
  const challengeID = useParams().id;
  const history = useHistory();

  const [loading, setLoading] = useState(true);
  const [runTable, setRunData] = useState([]);
  const [title, setTitle] = useState();
  const [playerCount, setPlayerCount] = useState(false);
  const [isDaily, setIsDaily] = useState(false);
  const [solutionImagePath, setSolutionImagePath] = useState(false);

  const setError = useCallback(() => {
    setRunData(<h5>No records for this challenge</h5>);
    setTitle("Error");
    setPlayerCount(false);
    setSolutionImagePath(false);
    document.title = "Leaderboard";
  }, []);

  const setLeaderboardData = useCallback(
    ({ daily, leaderboard, name, playerCount, solutionImage }) => {
      const currentUsername = AuthHandler.username;

      if (solutionImage) setSolutionImagePath(solutionImage);
      else setSolutionImagePath(false);

      const dailyChallenge = daily === true;
      if (dailyChallenge) setIsDaily(true);
      else setIsDaily(false);

      let table = [];
      let lastRank = 0;
      leaderboard.forEach(data => {
        if (data.rank !== lastRank + 1) {
          table.push(<div className={styles.hr} />);
        }
        lastRank = data.rank;
        table.push(
          <LeaderboardRow
            ownRow={data.username === currentUsername}
            key={data.username}
            rank={data.rank}
            name={data.username}
            id={data.id}
            pb={data.pb}
            age={data.age}
          />
        );
      });
      setRunData(table);
      setTitle(name);
      if (playerCount) setPlayerCount(playerCount);
      document.title = `${name} - Leaderboard`;
    },
    []
  );

  const fetchLeaderboard = useCallback(
    ({ id }) => {
      getLeaderboard(id).then(data => {
        if (data === null) setError();
        else setLeaderboardData(data);
        setLoading(false);
      });
    },
    [setLeaderboardData, setError]
  );

  const fetchPublicLeaderboard = useCallback(
    ({ id }) => {
      getPublicLeaderboard(id).then(data => {
        if (data === null) setError();
        else setLeaderboardData(data);
        setLoading(false);
      });
    },
    [setLeaderboardData]
  );

  useEffect(() => {
    if (window.location.pathname.includes("daily")) setIsDaily(true);
    
    if (!AuthHandler.loggedIn) fetchPublicLeaderboard({ id: challengeID });
    else fetchLeaderboard({ id: challengeID });
  }, [challengeID, fetchLeaderboard, fetchPublicLeaderboard, history]);

  return loading ? null : (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{title}</h2>
      </div>
      {isDaily ? (
        <DailyChallengePicker
          callback={newId => history.push(`/challenge/${newId}/leaderboard`)}
          currentID={challengeID}
        />
      ) : null}
      {solutionImagePath ? <SolutionImage path={solutionImagePath} /> : null}
      <div className={styles.nav}>
        <div className={styles.navLeft}>
          <Link to="/">Home</Link>
        </div>
        <div className={styles.navRight}>
          {isDaily ? (
            <a href="/challenge/daily">Play Daily</a>
          ) : (
            <a href={`/challenge/${challengeID}`}>Play Challenge</a>
          )}
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

export default Leaderboard;
