import { useEffect, useState } from "react";
import styles from "./ChampionshipList.module.css";
import adminStyles from "../AdminStyles.module.css";
import { Link } from "react-router-dom";
import { getChampionshipList } from "../AdminService";

const ChampionshipList = props => {
  const [championshipsList, setChampionshipsList] = useState(false);

  useEffect(() => {
    document.title = "Championships List";
    getChampionshipList().then(championships => {
      console.log(championships);
      const list = generateChampionshipsList(championships);
      setChampionshipsList(list);
    });
  }, []);

  return (
    <div>
      <h4>Championships</h4>
      {championshipsList ? championshipsList : null}
    </div>
  );
};
export default ChampionshipList;

const generateChampionshipsList = championships => {
  let list = [];
  for (let i = 0; i < championships.length; i++) {
    const championship = championships[i];
    list.push(
      <ChampionshipListElement
        id={championship._id}
        theme={i % 2 === 0 ? adminStyles.even : adminStyles.odd}
        name={championship.name}
      />
    );
  }
  return list;
};

const ChampionshipListElement = props => {
  return (
    <div className={`${adminStyles.listElement} ${styles.listElement} ${props.theme}`}>
      <Link to={`/admin/championship/${props.id}`}>{props.name}</Link>
    </div>
  );
};
