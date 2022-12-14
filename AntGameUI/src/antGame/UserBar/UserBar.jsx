import styles from "./UserBar.module.css";
import AuthHandler from "../Auth/AuthHandler";
import PersonalRecord from "./PersonalRecord";
import WorldRecord from "./WorldRecord";
import { Link } from "react-router-dom";
import Username from "../User/Username";
import { HomeLink } from "./HomeLink";

const UserBar = ({ showRecords, showLinkToSandbox, showLinkHome }) => {
  return (
    <div className={styles.container}>
      <div className={styles.personalRecord}>{showRecords ? <PersonalRecord /> : null}</div>
      <div className={styles.worldRecord}>
        {showRecords && <WorldRecord />}
        {showLinkHome && <HomeLink />}
        {showLinkToSandbox && <a href="/sandbox">Sandbox Mode</a>}
      </div>

      <div className={styles.username}>
        {!AuthHandler.loggedIn || AuthHandler.isAnon ? (
          <div>
            Not logged in.&nbsp;
            <Link
              className={styles.loginLink}
              to={`/login?redirect=${window.location.pathname}`}
              onClick={async () => {
                await AuthHandler.logout();
              }}
            >
              Login
            </Link>
          </div>
        ) : (
          <div>
            <Username
              id={AuthHandler.decodedToken.id}
              name={AuthHandler.username}
              showBorder={false}
            />
            <Link
              className={styles.loginLink}
              to="/"
              onClick={async () => {
                await AuthHandler.logout();
                if (window.location.pathname === "/") window.location.reload();
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
