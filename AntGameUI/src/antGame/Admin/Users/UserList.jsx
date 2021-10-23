import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentlyCreatedUsers, getRecentlyLoggedInUsers } from "../AdminService";
import { GetTimeString } from "../Helpers/FunctionHelpers";
import styles from "./UserList.module.css";
import adminStyles from "../AdminStyles.module.css";
import UserSelect from "./UserSelect";

const UserList = () => {
  const [usersToDisplay, setUsersToDisplay] = useState(false);
  const [tableHeader, setTableHeader] = useState();

  const getUserList = getBy => {
    if (getBy === "recentCreate") {
      getAndSetRecentlyCreated();
    } else if (getBy === "recentLogin") {
      getAndSetRecentlyLoggedIn();
    }
  };

  const getAndSetRecentlyLoggedIn = () => {
    getRecentlyLoggedInUsers(15).then(users => {
      buildAndSetUserList(users);
      setTableHeader(
        <div className={`${styles.titleRow}`}>
          <span>Username</span>
          <span>Last Login</span>
        </div>
      );
    });
  };

  const getAndSetRecentlyCreated = () => {
    getRecentlyCreatedUsers(15).then(users => {
      buildAndSetUserList(users);
      setTableHeader(
        <div className={`${styles.titleRow}`}>
          <span>Username</span>
          <span>Created</span>
        </div>
      );
    });
  };

  const buildAndSetUserList = (users, fieldToShow) => {
    let list = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      list.push(
        <UsersListElement
          theme={i % 2 === 0 ? adminStyles.even : adminStyles.odd}
          user={user}
          key={user._id}
        />
      );
    }
    setUsersToDisplay(list);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Users List</h3>
        <div className={styles.selectContainer}>
          <UserSelect onChange={value => getUserList(value)} />
        </div>
      </div>
      {tableHeader}
      {usersToDisplay}
    </div>
  );
};
export default UserList;

const UsersListElement = props => {
  // debugger
  return (
    <div className={`${styles.userRow} ${props.theme} ${props.user.banned ? styles.banned : null}`}>
      <span className={""}>
        <Link to={`/admin/user/${props.user._id}`}>{props.user.username}</Link>
      </span>
      <span>
        {props.user.registrationData ? GetTimeString(props.user.registrationData.date) : null}
        {props.user.loginRecord ? GetTimeString(props.user.loginRecord?.time) : null}
      </span>
    </div>
  );
};
