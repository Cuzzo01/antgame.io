import { useForm } from "react-hook-form";
import styles from "./RegistrationPage.module.css";
import { registerAccount } from "../AuthService";
import AuthHandler from "../AuthHandler";
import { useHistory, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getFlag } from "../../Helpers/FlagService";

const RegistrationPage = props => {
  const {
    register,
    formState: { errors },
    handleSubmit,
    getValues,
    setError,
  } = useForm();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    getFlag("allowAccountRegistration")
      .then(value => {
        if (value !== true) history.replace("/");
      })
      .catch(e => {
        history.replace("/");
      });
  }, [history]);

  function redirectOut() {
    const search = location.search;
    const params = new URLSearchParams(search);
    const redirectLoc = params.get("redirect");
    if (redirectLoc) history.replace(redirectLoc);
    else history.replace("/challenge");
  }

  const onSubmit = data => {
    registerAccount(
      data.username,
      data.password,
      data.email,
      localStorage.getItem("client-id")
    ).then(result => {
      if (result === "usernameTaken")
        setError("username", {
          type: "manual",
          message: "Username taken",
        });
      else {
        AuthHandler.token = result;
        redirectOut();
      }
    });
  };

  if (AuthHandler.loggedIn) {
    redirectOut();
  }

  return (
    <div className={styles.container}>
      <h3>Account Registration</h3>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.inputField}>
          <label htmlFor="username">Username</label>
          <br />
          <input
            {...register("username", {
              required: true,
              minLength: "5",
              maxLength: "15",
              pattern: /^\S*$/,
            })}
            autoComplete="username"
          />
          {errors.username?.type === "manual" && (
            <ErrorMessage>{errors.username.message}</ErrorMessage>
          )}
          {errors.username?.type === "required" && <ErrorMessage>Required</ErrorMessage>}
          {errors.username?.type === "minLength" && (
            <ErrorMessage>Must be at least 5 characters</ErrorMessage>
          )}
          {errors.username?.type === "maxLength" && (
            <ErrorMessage>Cannot be over 15 characters</ErrorMessage>
          )}
          {errors.username?.type === "pattern" && (
            <ErrorMessage>Username can't contain whitespace</ErrorMessage>
          )}
        </div>
        <div className={styles.inputField}>
          <label htmlFor="password">Password</label>
          <br />
          <input
            {...register("password", { required: true, minLength: "8", maxLength: "100" })}
            type="password"
            autoComplete="new-password"
          />
          {errors.password?.type === "required" && <ErrorMessage>Required</ErrorMessage>}
          {errors.password?.type === "minLength" && (
            <ErrorMessage>Must be at least 8 characters</ErrorMessage>
          )}
          {errors.password?.type === "maxLength" && (
            <ErrorMessage>Cannot be over 100 characters</ErrorMessage>
          )}
        </div>
        <div className={styles.inputField}>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <br />
          <input
            {...register("confirmPassword", {
              required: true,
              validate: {
                passwordMatch: value => value === getValues().password,
              },
            })}
            type="password"
            autoComplete="new-password"
          />
          {errors.confirmPassword?.type === "required" && <ErrorMessage>Required</ErrorMessage>}
          {errors.confirmPassword?.type === "passwordMatch" && (
            <ErrorMessage>Passwords must match</ErrorMessage>
          )}
        </div>
        <div className={styles.inputField}>
          <label htmlFor="email">
            Email <strong>(Optional)</strong>
          </label>
          <br />
          <input {...register("email")} autoComplete="email" type="email" />
          {errors.email ? <ErrorMessage>email is required</ErrorMessage> : null}
          <p className={styles.subtext}>Only used for account recovery</p>
        </div>
        <button className={styles.submitButton} type="submit">
          Register Account
        </button>
      </form>
    </div>
  );
};
export default RegistrationPage;

const ErrorMessage = props => {
  return <p className={styles.errorMessage}>{props.children}</p>;
};
