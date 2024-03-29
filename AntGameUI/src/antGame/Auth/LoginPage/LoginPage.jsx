import { useEffect, useState } from "react";
import styles from "./LoginPage.module.css";
import globalStyles from "../../Helpers/GenericStyles.module.css";
import AuthHandler from "../AuthHandler";
import { Link, useLocation } from "react-router-dom";
import { getFlag } from "../../Helpers/FlagService";
import { useForm } from "react-hook-form";
import { SetPageCanonical, SetPageDescription, SetPageTitle } from "../../Helpers/DocumentHelpers";

const LoginPage = () => {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  const [formState, setFormState] = useState("");
  const [allowLogins, setAllowLogins] = useState(true);
  const [disabledMessage, setDisabledMessage] = useState("");
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [disableSubmit, setDisableSubmit] = useState(false);
  const [allowAnon, setAllowAnon] = useState(true);
  const location = useLocation();

  useEffect(() => {
    SetPageTitle("AntGame Login");
    SetPageDescription("Login to AntGame");
    SetPageCanonical();

    getFlag("allow-logins").then(async value => {
      if (value !== true && !window.location.href.includes("/admin")) {
        setAllowLogins(false);
        setDisabledMessage(await getFlag("disabled-login-message"));
      } else {
        getFlag("allowAccountRegistration")
          .then(value => setAllowRegistration(value))
          .catch(e => console.log(e));

        getFlag("allow-anon-logins")
          .then(value => setAllowAnon(value))
          .catch(e => console.log(e));
      }
    });
  }, []);

  function redirectOut() {
    const search = location.search;
    const params = new URLSearchParams(search);
    const redirectLoc = params.get("redirect");
    const protocol = window.location.protocol;
    const host = window.location.host;

    let redirectUrl;
    try {
      redirectUrl = new URL(`${protocol}//${host}${redirectLoc}`);
    } catch {
      redirectUrl = `${protocol}//${host}`;
    }

    window.location.replace(redirectUrl);
  }

  function onSubmit(data) {
    setDisableSubmit(true);
    if (formState === "loading") return;
    AuthHandler.login(data.username, data.password, data.rememberMe).then(result => {
      if (result.value === true) redirectOut();
      else if (result.value === false) setFormState("error");
      else if (result.value === "no user") setFormState("no user");
      else if (result.value === "disabled") setFormState("disabled");
      else if (result.value === "banned") {
        setFormState("banned");
        if (result.message) setDisabledMessage(result.message);
      } else if (result.value === "limited") {
        setFormState("limited");
        setDisabledMessage({ retryIn: result.retryIn, message: result.message });
        setTimeout(() => setDisableSubmit(false), 10000);
        return;
      }

      setTimeout(() => setDisableSubmit(false), 5000);
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
      {allowLogins ? (
        <div>
          <h3 className={`${styles.title} ${styles.bold}`}>Login</h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.inputField}>
              <label htmlFor="username">Username:</label>
              <br />
              <input
                {...register("username", {
                  required: true,
                  minLength: "5",
                  maxLength: "15",
                  pattern: /^[a-z0-9_]+$/i,
                })}
                autoComplete="username"
              />
              {errors.username?.type === "required" && <ErrorMessage>Required</ErrorMessage>}
              {(errors.username?.type === "minLength" ||
                errors.username?.type === "maxLength" ||
                errors.username?.type === "pattern") && <ErrorMessage>Must enter a valid username</ErrorMessage>}
            </div>
            <div className={styles.inputField}>
              <label htmlFor="password">Password:</label>
              <br />
              <input
                {...register("password", { required: true, minLength: "8", maxLength: "100" })}
                type="password"
                autoComplete="current-password"
              />
              {errors.password?.type === "required" && <ErrorMessage>Required</ErrorMessage>}
              {(errors.password?.type === "minLength" || errors.password?.type === "maxLength") && (
                <ErrorMessage>Must enter a valid password</ErrorMessage>
              )}
            </div>
            {formState === "error" ? <div className={styles.error}>Login failed, try again</div> : null}
            {formState === "no user" ? <div className={styles.error}>No user with that name</div> : null}
            {formState === "banned" && (
              <div className={styles.error}>
                Account banned
                {disabledMessage && (
                  <span>
                    <br />
                    Reason: {disabledMessage}
                  </span>
                )}
              </div>
            )}
            {formState === "disabled" && <div className={styles.error}>Login disabled</div>}
            {formState === "limited" && (
              <div className={styles.error}>
                Timed Out
                <br /> {disabledMessage.message} <br /> Retry in {disabledMessage.retryIn} seconds
              </div>
            )}
            <input type="submit" style={{ display: "none" }} />
            <div className={styles.rememberCheckBox}>
              <input {...register("rememberMe")} type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <div className={styles.buttonBar}>
              {allowAnon ? (
                <div className={`${globalStyles.divButton} ${styles.skipButton}`} onClick={continueWithoutLogin}>
                  Skip
                </div>
              ) : (
                <div />
              )}
              <button className={styles.submitButton} type="submit" disabled={disableSubmit}>
                Submit
              </button>
            </div>
          </form>
          {allowRegistration ? (
            <div className={styles.registerLink}>
              <Link to="/register">Create Account</Link>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={styles.disabledMessage}>
          <h3 className={`${styles.title} ${styles.bold}`}>AntGame Is Offline</h3>
          <br />
          {disabledMessage}
        </div>
      )}
    </div>
  );
};
export default LoginPage;

const ErrorMessage = props => {
  return <p className={styles.errorMessage}>{props.children}</p>;
};
