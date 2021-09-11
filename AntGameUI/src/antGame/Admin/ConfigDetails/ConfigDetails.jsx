import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConfigDetails, patchConfigDetails } from "../AdminService";
import ExpandList from "../Helpers/ExpandList";
import { GetTimeString } from "../Helpers/FunctionHelpers";
import styles from "./ConfigDetails.module.css";
import adminStyles from "../AdminStyles.module.css";
import OrderSection from "./OrderSection";
import ThumbnailSection from "./ThumbnailEditor";

const ConfigDetails = props => {
  const [details, setDetails] = useState(false);

  useEffect(() => {
    populateDetails(props.id);
  }, [props.id]);

  const populateDetails = id => {
    getConfigDetails(id).then(details => {
      setDetails(details);
    });
  };

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
            <Link to={`/challenge/leaderboard/${props.id}`} target="_blank">
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
          <Link to={`/admin/user/${record.userID}`}>{record.username}</Link>
        </div>
      );
    }
  }
  return listToReturn;
};
