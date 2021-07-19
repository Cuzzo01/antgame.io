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
    if (!AuthHandler.loggedIn) {
      history.replace({ pathname: "/login", search: "?redirect=/challenge" });
      return;
    }
    getActiveChallenges().then(challengeResponse => {
      const records = challengeResponse.records;
      let list = [];
      challengeResponse.challenges.forEach(challenge => {
        list.push(
          <ListItem key={challenge.id} name={challenge.name} records={records[challenge.id]} id={challenge.id} />
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
  console.log(typeof props.records.wr);
  return (
    <div
      href="/"
      className={styles.listItem}
      onClick={e => {
        e.preventDefault();
        // Why does this break map render?? (prob because of lifecycle stuff)
        // history.push(`/challenge/${props.id}`)
        window.location = `/challenge/${props.id}`;
      }}
    >
      <div className={styles.title}>
        <div>
          <span className={styles.mapName}>{props.name}</span>
          <br />
          <LeaderboardLink id={props.id} />
        </div>
      </div>
      <div className={styles.records}>
        {AuthHandler.isAnon ? (
          <div />
        ) : (
          <div className={styles.pr}>
            Personal Record
            <br />
            {props.records.pb ? props.records.pb : "No record"}
          </div>
        )}
        <div className={styles.wr}>
          World Record
          <br />
          {!props.records.wr || Object.keys(props.records.wr).length === 0
            ? "No record"
            : `${props.records.wr.score} - ${props.records.wr.username}`}
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