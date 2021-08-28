import { useEffect, useState } from "react";
import { getUserDetails, patchUserDetails } from "../AdminService";
import ExpandList from "../Helpers/ExpandList";
import { GetGeneralTimeString, GetTimeString } from "../Helpers/FunctionHelpers";
import styles from "./UserDetails.module.css";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const UserDetails = props => {
  const [details, setDetails] = useState(false);

  useEffect(() => {
    populateDetails(props.id);
  }, [props.id]);

  const populateDetails = id => {
    getUserDetails(id).then(result => {
      setDetails(result);
    });
  };

  const setBanned = newBanned => {
    patchUserDetails(props.id, { banned: newBanned }).then(result => {
      setDetails(result);
    });
  };

  return (
    <div>
      {details ? (
        <div>
          <h4 className={styles.username}>{details.username}</h4>
          <div className={styles.divSection}>
            <h5>Details</h5>
            <p>ShowOnLeaderboard: {boolToString(details.showOnLeaderboard)}</p>
            <p>Admin: {boolToString(details.admin)}</p>
            <p>Banned: {boolToString(details.banned)}</p>
          </div>
          <ExpandList
            title={"Challenge Details"}
            itemsToList={getDetailsList(details.activeChallengeDetails)}
            emptyMessage={"No runs on active challenges"}
          />
          <ExpandList
            title={"Logins"}
            itemsToList={getLoginsList(details.loginRecords)}
            emptyMessage={"No Recorded Logins"}
          />
          <div className={styles.divSection}>
            <h5>Registration Data</h5>
            {details.registrationData ? (
              <div>
                <p>IP: {getFormattedIpString(details.registrationData.IP)}</p>
                <p>ClientID: {details.registrationData.clientID}</p>
                <p>Date: {GetTimeString(details.registrationData.date)}</p>
                <p>Email: {details.email ? details.email : "No Email"}</p>
              </div>
            ) : (
              "No Details"
            )}
          </div>
          <div className={styles.divSection}>
            <h5>Actions</h5>
            <Button onClick={() => setBanned(!details.banned)}>
              {details.banned ? "Unban User" : "Ban User"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default UserDetails;

const boolToString = bool => {
  return bool ? "Yes" : "No";
};

const getLoginsList = loginRecords => {
  let listToReturn = [];
  if (!loginRecords) return listToReturn;
  for (let i = 0; i < loginRecords.length; i++) {
    const record = loginRecords[i];

    listToReturn.push(
      <div className={styles.loginListItem}>
        <span title={"Local Time"}>({GetTimeString(record.time)})</span>
        <span className={styles.alignRight}>{getFormattedIpString(record.IP)}</span>
        <span className={styles.alignRight}>{record.clientID}</span>
      </div>
    );
  }
  return listToReturn;
};

const getDetailsList = challengeRecords => {
  let listToReturn = [];
  if (!challengeRecords) return listToReturn;
  for (const [challengeID, challengeDetails] of Object.entries(challengeRecords)) {
    listToReturn.push(
      <div className={styles.challengeListItem}>
        <span className={styles.alignRight} title={GetTimeString(challengeDetails.runTime)}>
          ({GetGeneralTimeString(challengeDetails.runTime)} ago)
        </span>
        <span className={styles.alignCenter}>#{challengeDetails.rank}</span>
        <span className={styles.alignCenter}>
          <Link to={""}>{challengeDetails.score}</Link>
        </span>
        <span>
          <Link to={`/admin/config/${challengeID}`}>{challengeDetails.name}</Link>
        </span>
      </div>
    );
  }
  return listToReturn;
};

const getFormattedIpString = IP => {
  // IPv4
  if (IP.length <= 15) return IP;
  // IPv6
  else {
    const IPArray = IP.split(":");
    return IPArray.slice(0, 4).join(":");
  }
};
