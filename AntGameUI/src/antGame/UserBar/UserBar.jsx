import styles from "./UserBar.module.css";
import AuthHandler from "../Auth/AuthHandler";
import PersonalRecord from "./PersonalRecord";
import WorldRecord from "./WorldRecord";

const UserBar = props => {
  return (
    <div className={styles.container}>
      <div className={styles.personalRecord}>{props.showRecords ? <PersonalRecord /> : null}</div>
      <div className={styles.worldRecord}>{props.showRecords ? <WorldRecord /> : null}</div>
      <div className={styles.username}>
        {AuthHandler.isAnon ? (
          <div>
            Not logged in.{" "}
            <a
              className={styles.loginLink}
              href={`/login?redirect=${window.location.pathname}`}
              onClick={() => {
                AuthHandler.logout();
              }}
            >
              Login
            </a>
          </div>
        ) : (
          <div>
            {AuthHandler.username}
            <a
              className={styles.loginLink}
              href={`/login`}
              onClick={() => {
                AuthHandler.logout();
              }}
            >
              Logout
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
export default UserBar;
