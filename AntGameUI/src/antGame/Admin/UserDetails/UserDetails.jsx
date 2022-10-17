import { useEffect, useState } from "react";
import { getUserDetails, patchUserDetails } from "../AdminService";
import ExpandList from "../Helpers/ExpandList";
import { GetGeneralTimeString, GetTimeString } from "../Helpers/FunctionHelpers";
import styles from "./UserDetails.module.css";
import adminStyles from "../AdminStyles.module.css";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { StringEdit } from "../Helpers/Inputs";
import Username from "../../User/Username";

const UserDetails = ({ id }) => {
  const [details, setDetails] = useState(false);

  useEffect(() => {
    populateDetails(id);
  }, [id]);

  const populateDetails = id => {
    getUserDetails(id).then(result => {
      document.title = `${result.username} - User Details`;
      setDetails(result);
    });
  };

  const setBanned = newBanned => {
    patchUserDetails(id, { banned: newBanned }).then(result => {
      setDetails(result);
    });
  };

  const setBanMessage = newMessage => {
    patchUserDetails(id, { banMessage: newMessage }).then(result => {
      setDetails(result);
    });
  };

  return (
    <div>
      {details ? (
        <div>
          <h4 className={styles.username}>
            <Username id={id} name={details.username} showBorder={false} />
          </h4>
          <div className={adminStyles.divSection}>
            <h5>Details</h5>
            <p>Admin: {boolToString(details.admin)}</p>
            <p>Banned: {boolToString(details.banned)}</p>
            {details.banInfo?.message && <span>Ban Reason: {details.banInfo.message}</span>}
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
          <div className={adminStyles.divSection}>
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
          <div className={adminStyles.divSection}>
            <h5>Actions</h5>
            <Button onClick={() => setBanned(!details.banned)}>
              {details.banned ? "Unban User" : "Ban User"}
            </Button>
          </div>
          {details.banned && (
            <div className={adminStyles.divSection}>
              <StringEdit
                value={details.banInfo?.message}
                label="Ban reason"
                editCallback={newMessage => setBanMessage(newMessage)}
              />
            </div>
          )}
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
        <span className={styles.playerCount}>/{challengeDetails.playerCount}&nbsp;</span>
        <span className={styles.alignCenter}>
          <Link to={`/admin/run/${challengeDetails.runID}`}>{challengeDetails.score}</Link>
        </span>
        <span>
          <Link to={`/admin/config/${challengeID}`}>{challengeDetails.name}</Link>
        </span>
        <span className={styles.alignRight}>{challengeDetails.runs} runs</span>
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
