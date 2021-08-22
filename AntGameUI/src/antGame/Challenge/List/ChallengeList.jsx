import { useEffect, useState } from "react";
import styles from "./ChallengePage.module.css";
import { getActiveChallenges } from "../../Challenge/ChallengeService";
import AuthHandler from "../../Auth/AuthHandler";
import { useHistory } from "react-router-dom";

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
    <div
      href="/"
      className={styles.listItem}
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
          <br />
          <LeaderboardLink id={props.id} />
        </div>
      </div>
      <div className={styles.records}>
        {AuthHandler.isAnon ? (
          <div />
        ) : (
          <div className={styles.pr}>
            {props.records.pb ? (
              <span>
                Personal Record
                <br />
                {props.records.rank ? (
                  <span className={styles.bold}>(#{props.records.rank})</span>
                ) : null}{" "}
                {props.records.pb}
              </span>
            ) : (
              "No PR"
            )}
          </div>
        )}
        <div className={styles.wr}>
          World Record
          <br />
          {!props.records.wr || Object.keys(props.records.wr).length === 0 ? (
            "No record"
          ) : (
            <div className={styles.worldRecord}>
              {props.records.wr.score}-{props.records.wr.username}{" "}
              <span className={styles.recordAge}>{props.records.wr.age} ago</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardLink = props => {
  const history = useHistory();
  return (
    <span
      className={styles.leaderboardLink}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        history.push(`/challenge/leaderboard/${props.id}`);
      }}
    >
      Leaderboard
    </span>
  );
};
