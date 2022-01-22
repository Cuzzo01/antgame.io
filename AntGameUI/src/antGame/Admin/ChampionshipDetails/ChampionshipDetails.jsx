import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getChampionshipDetails } from "../AdminService";
import adminStyles from "../AdminStyles.module.css";

const ChampionshipDetails = props => {
  const [details, setDetails] = useState(false);

  useEffect(() => {
    document.title = "Championship Details";
    getChampionshipDetails(props.id).then(tourneyDetails => {
      setDetails(tourneyDetails);
    });
  }, [props.id]);

  return (
    <div>
      {details ? (
        <div>
          <h4>{details.name}</h4>
          <div className={adminStyles.divSection}>
            <h5>Points</h5>
            {getPointsList(details.userPoints)}
          </div>
          <div className={adminStyles.divSection}>
            <h5>Challenges</h5>
            {getChallengesList(details.configs)}
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default ChampionshipDetails;

const getPointsList = pointsArr => {
  pointsArr.sort((a, b) => {
    if (a.points > b.points) return -1;
    return 1;
  });

  const list = [];
  for (let i = 0; i < pointsArr.length; i++) {
    const pointsEntry = pointsArr[i];
    list.push(
      <PointsListEntry
        key={pointsEntry.userID}
        rank={i + 1}
        name={pointsEntry.username}
        id={pointsEntry.userID}
        points={pointsEntry.points}
      />
    );
  }
  return list;
};

const getChallengesList = configs => {
  const list = [];
  configs.forEach(config => {
    console.log(config);
    list.push(<ChallengeListEntry key={config.id} name={config.name} id={config.id} />);
  });
  return list;
};
const PointsListEntry = props => {
  return (
    <div>
      <span>
        <strong>#{props.rank}</strong>
      </span>{" "}
      -&nbsp;
      <Link to={`/admin/user/${props.id}`}>{props.name}</Link> -&nbsp;
      <span>{props.points}</span>pts
    </div>
  );
};

const ChallengeListEntry = props => {
  return (
    <div>
      <Link to={`/admin/config/${props.id}`}>{props.name}</Link>
    </div>
  );
};
