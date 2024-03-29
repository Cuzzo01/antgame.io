import { useEffect, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { getLeaderboard, getPublicLeaderboard } from "../../Challenge/ChallengeService";
import styles from "./Leaderboard.module.css";
import AuthHandler from "../../Auth/AuthHandler";
import DailyChallengePicker from "./DailyChallengePicker";
import { useCallback } from "react";
import LeaderboardRow from "../../Helpers/LeaderboardRow";
import SolutionImage from "./SolutionImage";
import { SetPageDescription, SetPageTitle } from "../../Helpers/DocumentHelpers";

const Leaderboard = () => {
  const { id, page } = useParams();
  const history = useHistory();

  const [loading, setLoading] = useState(true);
  const [runTable, setRunData] = useState([]);
  const [title, setTitle] = useState();
  const [playerCount, setPlayerCount] = useState(false);
  const [isDaily, setIsDaily] = useState(false);
  const [solutionImagePath, setSolutionImagePath] = useState(false);
  const [pageNumber, setPageNumber] = useState(false);
  const [morePages, setMorePages] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const goToPage = useCallback(
    page => {
      if (page === 1) history.push(`/challenge/${id}/leaderboard`);
      else history.push(`/challenge/${id}/leaderboard/${page}`);
      setPageNumber(page);
    },
    [history, id]
  );

  const setError = useCallback(() => {
    if (pageNumber !== 1) goToPage(1);
    else {
      setRunData(<h5>No records for this challenge</h5>);
      setTitle("Error");
      setPlayerCount(false);
      setSolutionImagePath(false);
      document.title = "Leaderboard";
    }
  }, [pageNumber, goToPage]);

  const setLeaderboardData = useCallback(
    ({ daily, leaderboard, name, playerCount, solutionImage, pageLength, active }) => {
      const currentUsername = AuthHandler.username;

      if (solutionImage) setSolutionImagePath(solutionImage);
      else setSolutionImagePath(false);

      const dailyChallenge = daily === true;
      if (dailyChallenge) setIsDaily(true);
      else setIsDaily(false);

      let table = [];
      let lastRank = 0;
      leaderboard.forEach(data => {
        if (data.extra && table.length) table.push(<div className={styles.hr} />);
        lastRank = data.rank;
        let rankLink, personalPage;
        if (data.extra) {
          personalPage = Math.floor(data.rank / (pageLength + 1)) + 1;
          rankLink = data.extra ? () => goToPage(personalPage) : undefined;
          lastRank = 0;
        }
        table.push(
          <LeaderboardRow
            ownRow={data.username === currentUsername}
            key={data.username + personalPage}
            rank={data.rank}
            name={data.username}
            id={data.id}
            pb={data.pb}
            age={data.age}
            rankLink={rankLink}
          />
        );
        if (data.extra && table.length === 1) table.push(<div className={styles.hr} key="hr" />);
      });
      setRunData(table);
      setTitle(name);
      setPlayerCount(playerCount);
      setMorePages(playerCount > pageLength && lastRank !== playerCount);
      setIsActive(active);

      SetPageTitle(`${name} - AntGame Leaderboard${page > 1 ? ` - Page ${page}` : ""}`);
      SetPageDescription(`The leaderboard for ${name} - Page ${page ?? 1}`);
    },
    [goToPage, page]
  );

  const fetchLeaderboard = useCallback(
    (id, pageNumber) => {
      getLeaderboard(id, pageNumber).then(data => {
        if (data === null) setError();
        else setLeaderboardData(data);
        setLoading(false);
      });
    },
    [setLeaderboardData, setError]
  );

  const fetchPublicLeaderboard = useCallback(
    (id, pageNumber) => {
      getPublicLeaderboard(id, pageNumber).then(data => {
        if (data === null && pageNumber !== 1) goToPage(1);
        else if (data === null) setError();
        else setLeaderboardData(data);
        setLoading(false);
      });
    },
    [setLeaderboardData, setError, goToPage]
  );

  const refreshLeaderboard = useCallback(
    (id, pageNumber) => {
      if (!AuthHandler.loggedIn) fetchPublicLeaderboard(id, pageNumber);
      else fetchLeaderboard(id, pageNumber);
    },
    [fetchLeaderboard, fetchPublicLeaderboard]
  );

  useEffect(() => {
    if (window.location.pathname.includes("daily")) setIsDaily(true);

    let parsedPage;
    if (page) parsedPage = parseInt(page);
    else parsedPage = 1;

    setPageNumber(parsedPage);
    refreshLeaderboard(id, parsedPage);
  }, [id, history, page, refreshLeaderboard]);

  const navigateCallback = useCallback(
    newId => {
      history.push(`/challenge/${newId}/leaderboard`);
    },
    [history]
  );

  return loading ? null : (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{title}</h2>
      </div>
      {isDaily ? <DailyChallengePicker callback={navigateCallback} currentID={id} /> : null}
      {solutionImagePath ? <SolutionImage path={solutionImagePath} /> : null}
      <div className={styles.nav}>
        <div className={styles.navLeft}>
          <Link to="/">Home</Link>
        </div>
        <div className={styles.navRight}>
          {isDaily && isActive && <a href="/challenge/daily">Play Daily</a>}
          {isDaily && !isActive && <a href={`/replay/${id}`}>Replay</a>}
          {!isDaily && <a href={`/challenge/${id}`}>Play Challenge</a>}
        </div>
      </div>
      {runTable}
      <div className={styles.pageNav}>
        {pageNumber !== 1 ? (
          <span className={styles.link} onClick={() => goToPage(pageNumber - 1)}>
            &lt;&lt;
          </span>
        ) : (
          <span>&nbsp;&nbsp;</span>
        )}
        <span>{pageNumber}</span>
        {morePages ? (
          <span className={styles.link} onClick={() => goToPage(pageNumber + 1)}>
            &gt;&gt;
          </span>
        ) : (
          <span>&nbsp;&nbsp;</span>
        )}
      </div>
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
