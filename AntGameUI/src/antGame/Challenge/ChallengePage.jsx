import { useEffect, useState } from "react";
import styles from "./ChallengePage.module.css";
import { getActiveChallenges } from "../AntGameHelpers/Services/ChallengeService";
import AuthHandler from "../Auth/AuthHandler";
import { useHistory } from "react-router-dom";

const ChallengePage = () => {
  const [loading, setLoading] = useState(true);
  const [menuList, setMenuList] = useState([]);
  const history = useHistory();

  useEffect(() => {
    if (!AuthHandler.loggedIn) {
      history.push({ pathname: "/login", search: "?redirect=/challenge" });
      return;
    }
    getActiveChallenges().then((activeChallenges) => {
      let list = [];
      activeChallenges.forEach((challenge) => {
        list.push(
          <ListItem
            key={challenge.id}
            name={challenge.name}
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
export default ChallengePage;

const ListItem = (props) => {
  return (
    <a
      href="/"
      className={styles.listItem}
      onClick={(e) => {
        e.preventDefault();
        // Why does this break map render?? (prob because of lifecycle stuff)
        // history.push(`/challenge/${props.id}`)
        window.location = `/challenge/${props.id}`;
      }}
    >
      {props.name}
    </a>
  );
};
