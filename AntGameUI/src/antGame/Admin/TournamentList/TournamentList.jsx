import { useEffect, useState } from "react";
import { getTournamentList } from "../AdminService";
import styles from "./TournamentList.module.css";
import adminStyles from "../AdminStyles.module.css";
import { Link } from "react-router-dom";

const TournamentList = props => {
  const [tournamentsList, setTournamentsList] = useState(false);

  useEffect(() => {
    document.title = "Tournaments List";
    getTournamentList().then(tournaments => {
      console.log(tournaments);
      const list = generateTournamentsList(tournaments);
      setTournamentsList(list);
    });
  }, []);

  return (
    <div>
      <h4>Tournaments</h4>
      {tournamentsList ? tournamentsList : null}
    </div>
  );
};
export default TournamentList;

const generateTournamentsList = tournaments => {
  let list = [];
  for (let i = 0; i < tournaments.length; i++) {
    const tournament = tournaments[i];
    list.push(
      <TournamentListElement
        id={tournament._id}
        theme={i % 2 === 0 ? adminStyles.even : adminStyles.odd}
        name={tournament.name}
      />
    );
  }
  return list;
};

const TournamentListElement = props => {
  return (
    <div className={`${adminStyles.listElement} ${styles.listElement} ${props.theme}`}>
      <Link to={`/admin/tournament/${props.id}`}>{props.name}</Link>
    </div>
  );
};
