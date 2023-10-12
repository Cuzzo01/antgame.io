import { useCallback, useEffect, useState } from "react";
import { getRecentlyCreatedUsers, getRecentlyLoggedInUsers } from "../AdminService";
import { GetTimeString } from "../Helpers/FunctionHelpers";
import styles from "./UserList.module.css";
import adminStyles from "../AdminStyles.module.css";
import UserSelect from "./UserSelect";
import Username from "../../User/Username";

const UserList = () => {
  const [usersToDisplay, setUsersToDisplay] = useState(false);
  const [tableHeader, setTableHeader] = useState();

  useEffect(() => {});

  document.title = "User List";

  const buildAndSetUserList = useCallback(users => {
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
  }, []);

  const getAndSetRecentlyLoggedIn = useCallback(() => {
    getRecentlyLoggedInUsers(15).then(users => {
      buildAndSetUserList(users);
      setTableHeader(
        <div className={`${styles.titleRow}`}>
          <span>Username</span>
          <span>Last Login</span>
          <span>Type</span>
        </div>
      );
    });
  }, [buildAndSetUserList]);

  const getAndSetRecentlyCreated = useCallback(() => {
    getRecentlyCreatedUsers(15).then(users => {
      buildAndSetUserList(users);
      setTableHeader(
        <div className={`${styles.titleRow}`}>
          <span>Username</span>
          <span>Created</span>
        </div>
      );
    });
  }, [buildAndSetUserList]);

  const getUserList = useCallback(
    getBy => {
      if (getBy === "recentCreate") {
        getAndSetRecentlyCreated();
      } else if (getBy === "recentLogin") {
        getAndSetRecentlyLoggedIn();
      }
    },
    [getAndSetRecentlyCreated, getAndSetRecentlyLoggedIn]
  );

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

const UsersListElement = ({ theme, user }) => {
  return (
    <div className={`${styles.userRow} ${theme} ${user.banned ? styles.banned : null}`}>
      <span className={""}>
        <Username id={user._id} name={user.username} adminLink />
      </span>
      <span>
        {user.registrationData ? GetTimeString(user.registrationData.date) : null}
        {user.loginRecord ? GetTimeString(user.loginRecord?.time) : null}
      </span>
      <span>{user.loginRecord?.type}</span>
    </div>
  );
};
