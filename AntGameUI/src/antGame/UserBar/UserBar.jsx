import styles from "./UserBar.module.css";
import AuthHandler from "../Auth/AuthHandler";
import PersonalRecord from "./PersonalRecord";
import WorldRecord from "./WorldRecord";
import { Link } from "react-router-dom";

const UserBar = props => {
  return (
    <div className={styles.container}>
      <div className={styles.personalRecord}>{props.showRecords ? <PersonalRecord /> : null}</div>
      <div className={styles.worldRecord}>
        {props.showRecords ? <WorldRecord /> : null}
        {props.showLinkHome ? <Link to="/">Home</Link> : null}
      </div>

      <div className={styles.username}>
        {!AuthHandler.loggedIn || AuthHandler.isAnon ? (
          <div>
            Not logged in.&nbsp;
            <Link
              className={styles.loginLink}
              to={`/login?redirect=${window.location.pathname}`}
              onClick={() => {
                AuthHandler.logout();
              }}
            >
              Login
            </Link>
          </div>
        ) : (
          <div>
            {AuthHandler.username}
            <Link
              className={styles.loginLink}
              to="/home"
              onClick={() => {
                AuthHandler.logout();
              }}
            >
              Logout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
export default UserBar;
