import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConfigDetails, patchConfigDetails } from "../AdminService";
import ExpandList from "../Helpers/ExpandList";
import { GetTimeString } from "../Helpers/FunctionHelpers";
import styles from "./ConfigDetails.module.css";
import adminStyles from "../AdminStyles.module.css";
import OrderSection from "./OrderSection";
import ThumbnailSection from "./ThumbnailSection";
import Username from "../../User/Username";

const ConfigDetails = props => {
  const [details, setDetails] = useState(false);
  // const [tournamentOptionsList, setTournamentOptionsList] = useState(false);
  // const [tournamentPickerValue, setTournamentPickerValue] = useState("");

  useEffect(() => {
    populateDetails(props.id);
  }, [props.id]);

  const populateDetails = id => {
    getConfigDetails(id).then(details => {
      document.title = `${details.name} - Details`;
      setDetails(details);
    });
  };

  // const populateTournamentList = () => {
  //   if (tournamentOptionsList === false) {
  //     getTournamentList().then(list => {
  //       const optionList = [];
  //       list.forEach(tournament => {
  //         optionList.push(
  //           <option key={tournament._id} value={tournament._id} label={tournament.name} />
  //         );
  //       });
  //       setTournamentOptionsList(optionList);
  //     });
  //     setTournamentOptionsList("loading");
  //   }
  // };

  // const bindTournament = event => {
  //   event.preventDefault();
  //   // patch config with tournamentID
  // };

  const setActive = state => {
    patchConfigDetails(props.id, { active: state }).then(result => {
      populateDetails(props.id);
    });
  };

  const setOrder = newOrder => {
    patchConfigDetails(props.id, { order: newOrder }).then(result => {
      populateDetails(props.id);
    });
  };

  const setThumbnailURL = newURL => {
    patchConfigDetails(props.id, { thumbnailURL: newURL }).then(result => {
      populateDetails(props.id);
    });
  };

  return (
    <div>
      {details ? (
        <div>
          <div className={styles.header}>
            <Link target="_blank" to={`/challenge/${props.id}`}>
              <h4>{details.name}</h4>
            </Link>
            {details.active ? (
              <span className={`${styles.badge} ${styles.active}`}>Active</span>
            ) : (
              <span className={`${styles.badge} ${styles.inactive}`}>Not Active</span>
            )}
            <div>
              <div className={styles.toggleButton} onClick={() => setActive(!details.active)}>
                Toggle Active
              </div>
            </div>
          </div>
          <div className={adminStyles.divSection}>
            <h5>Details</h5>
            PlayerCount: {details.playerCount}&nbsp;
            <Link to={`/challenge/${props.id}/leaderboard`} target="_blank">
              (Leaderboard)
            </Link>
            <br />
            Homes: {details.homeLimit}
            <br />
            Map: {details.mapPath}
            <br />
            Time: {details.seconds} sec
          </div>
          <div className={adminStyles.divSection}>
            <OrderSection
              currentOrder={details.order}
              handleSave={newOrder => {
                setOrder(newOrder);
              }}
            />
          </div>
          <div className={adminStyles.divSection}>
            <ThumbnailSection
              currentURL={details.thumbnailURL}
              handleSave={newURL => {
                setThumbnailURL(newURL);
              }}
            />
          </div>
          <div className={styles.recordsSection}>
            <ExpandList
              title={"Records"}
              itemsToList={getRecordsList(details.records)}
              emptyMessage={"No Records"}
            />
          </div>
          <div className={adminStyles.divSection}>
            <h5>Championships</h5>
            {details.championshipID ? (
              <div>
                <h6>
                  Enrolled in championship (
                  <Link to={`/admin/championship/${details.championshipID}`}>Link</Link>)
                </h6>
                {details.pointsAwarded ? (
                  <div>
                    <h6>Points have been awarded</h6>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>
            ) : (
              <div>
                {/* Select Tournament to bind:{" "}
                <form className={styles.tournamentSelect} onSubmit={bindTournament}>
                  <input
                    value={tournamentPickerValue}
                    onChange={e => setTournamentPickerValue(e.target.value)}
                    list="tournaments"
                    onFocus={() => populateTournamentList()}
                  />
                  <input type="submit" />
                </form>
                {tournamentOptionsList === false || tournamentOptionsList === false ? null : (
                  <datalist id="tournaments">{tournamentOptionsList}</datalist>
                )} */}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default ConfigDetails;

const getRecordsList = records => {
  let listToReturn = [];

  if (records) {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      listToReturn.push(
        <div>
          <span title="Local time">({GetTimeString(record.time)})</span>
          &nbsp;
          <Link to={`/admin/run/${record.runID}`}>{record.score}</Link> -&nbsp;
          <Username id={record.userID} name={record.username} adminLink showBorder={false} />
        </div>
      );
    }
  }
  return listToReturn;
};
