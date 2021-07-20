import { useState } from "react";
import styles from "./LoginPage.module.css";
import AuthHandler from "../AuthHandler";
import { Link, useHistory, useLocation } from "react-router-dom";

const LoginPage = props => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formState, setFormState] = useState("");
  const history = useHistory();
  const location = useLocation();

  function redirectOut() {
    const search = location.search;
    const params = new URLSearchParams(search);
    const redirectLoc = params.get("redirect");
    if (redirectLoc) history.replace(redirectLoc);
    else history.replace("/challenge");
  }

  function handleChange(event) {
    const name = event.target.name;
    if (name === "username") setUsername(event.target.value);
    else if (name === "password") setPassword(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (formState === "loading") return;
    AuthHandler.login(username, password).then(result => {
      if (result === true) redirectOut();
      else if (result === false) setFormState("error");
    });
    setFormState("loading");
  }

  function continueWithoutLogin(event) {
    event.preventDefault();
    AuthHandler.loginAnon().then(result => {
      if (result === true) redirectOut();
    });
  }

  if (AuthHandler.loggedIn) {
    redirectOut();
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Login</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputField}>
          <label htmlFor="username">Username:</label>
          <br />
          <input
            className={styles.input}
            type="text"
            name="username"
            onChange={handleChange}
            value={username}
            autoComplete="username"
          />
        </div>
        <div className={styles.inputField}>
          <label htmlFor="password">Password:</label>
          <br />
          <input
            className={styles.input}
            type="password"
            name="password"
            onChange={handleChange}
            value={password}
            autoComplete="current-password"
          />
        </div>
        {formState === "error" ? <div className={styles.error}>Login failed, try again</div> : null}
        <input type="submit" style={{ display: "none" }} />
        <div className={styles.buttonBar}>
          <div className={`${styles.divButton} ${styles.right}`} onClick={handleSubmit}>
            Submit
          </div>
          <div className={`${styles.divButton} ${styles.left}`} onClick={continueWithoutLogin}>
            Skip
            <br />
            <span className={styles.subtext}>(scores won't save)</span>
          </div>
        </div>
      </form>
      <br />
      <div className={styles.registerLink}>
        <Link to="/register">Create Account</Link>
      </div>
    </div>
  );
};
export default LoginPage;
