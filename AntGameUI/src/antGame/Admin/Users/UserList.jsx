import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentlyCreatedUsers } from "../AdminService";
import { GetTimeString } from "../Helpers/FunctionHelpers";
import styles from "./UserList.module.css";

const UserList = () => {
  const [usersToDisplay, setUsersToDisplay] = useState(false);

  useEffect(() => {
    getRecentlyCreatedUsers(15).then(users => {
      let list = [];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        list.push(
          <UsersListElement
            theme={i % 2 === 0 ? styles.even : styles.odd}
            user={user}
            key={user._id}
          />
        );
      }
      setUsersToDisplay(list);
    });
  }, []);

  return (
    <div className={styles.container}>
      <h3>Users List</h3>
      Recently Created
      {usersToDisplay}
    </div>
  );
};
export default UserList;

const UsersListElement = props => {
  return (
    <div className={`${styles.userRow} ${props.theme} ${props.user.banned ? styles.banned : null}`}>
      <span className={""}>
        <Link to={`/admin/user/${props.user._id}`}>{props.user.username}</Link>
      </span>
      <span>
        {props.user.registrationData
          ? GetTimeString(props.user.registrationData?.date)
          : "No Details"}
      </span>
    </div>
  );
};
