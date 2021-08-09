import { useEffect, useState } from "react";
import { getUserDetails } from "../AdminService";
import ExpandList from "../Helpers/ExpandList";
import { GetTimeString } from "../Helpers/FunctionHelpers";
import styles from "./UserDetails.module.css";

const UserDetails = props => {
  const [details, setDetails] = useState(false);

  useEffect(() => {
    getUserDetails(props.id).then(result => {
      setDetails(result);
    });
  }, [props.id]);

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
          <div>
            <ExpandList
              title={"Logins"}
              itemsToList={getLoginsList(details.loginRecords)}
              emptyMessage={"No Recorded Logins"}
            />
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

const getFormattedIpString = IP => {
  // IPv4
  if (IP.length <= 15) return IP;
  // IPv6
  else {
    const IPArray = IP.split(":");
    return IPArray.slice(0, 4).join(":");
  }
};
