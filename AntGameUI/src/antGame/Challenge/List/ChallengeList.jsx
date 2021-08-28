import { useEffect, useState } from "react";
import styles from "./ChallengePage.module.css";
import { getActiveChallenges } from "../../Challenge/ChallengeService";
import AuthHandler from "../../Auth/AuthHandler";
import { Link, useHistory } from "react-router-dom";

const ChallengeList = () => {
  const [loading, setLoading] = useState(true);
  const [menuList, setMenuList] = useState([]);
  const history = useHistory();

  useEffect(() => {
    document.title = "Challenge List - AntGame";
    if (!AuthHandler.loggedIn) {
      history.replace({ pathname: "/login", search: "?redirect=/challenge" });
      return;
    }
    getActiveChallenges().then(challengeResponse => {
      const records = challengeResponse.records;
      let list = [];
      challengeResponse.challenges.forEach(challenge => {
        list.push(
          <ListItem
            key={challenge.id}
            name={challenge.name}
            records={records[challenge.id]}
            id={challenge.id}
          />
        );
      });
      setMenuList(list);
      setLoading(false);
    });
  }, [history]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Challenges</h2>
      </div>
      {loading ? null : menuList}
    </div>
  );
};
export default ChallengeList;

const ListItem = props => {
  // const history = useHistory();

  return (
    <div className={styles.listItem}>
      <div
        className={styles.challengeCard}
        onClick={e => {
          e.preventDefault();
          // This still breaks aspect ratio of game
          // history.push(`/challenge/${props.id}`);
          window.location = `/challenge/${props.id}`;
        }}
      >
        <div className={styles.title}>
          <div>
            <span className={styles.bold}>{props.name}</span>
          </div>
        </div>
        <div className={styles.challengeData}>
          {AuthHandler.isAnon ? (
            <div />
          ) : (
            <div className={styles.pr}>
              {props.records.pb ? (
                <span>
                  Personal Record
                  <br />
                  {props.records.runs ? (
                    <span>
                      Runs:<span className={styles.bold}>{props.records.runs}</span>&nbsp;
                    </span>
                  ) : null}
                  {props.records.pb}
                  {props.records.rank ? (
                    <span className={styles.bold}>&nbsp;(#{props.records.rank})</span>
                  ) : null}
                </span>
              ) : (
                "No PR"
              )}
            </div>
          )}
          <div className={`${styles.wr} ${styles.bold}`}>
            World Record
            {props.records.wr ? (
              <span className={styles.recordAge}>{props.records.wr.age} ago</span>
            ) : null}
            <br />
            {!props.records.wr || Object.keys(props.records.wr).length === 0 ? (
              "No record"
            ) : (
              <div className={styles.worldRecord}>
                {props.records.wr.score}-{props.records.wr.username}{" "}
              </div>
            )}
          </div>
        </div>
      </div>
      <LeaderboardLink id={props.id} />
    </div>
  );
};

const LeaderboardLink = props => {
  return (
    <Link
      className={`${styles.leaderboardLink} ${styles.bold}`}
      to={`/challenge/leaderboard/${props.id}`}
    >
      Leaderboard
    </Link>
  );
};
