import { useForm } from "react-hook-form";
import styles from "./RegistrationPage.module.css";

const RegistrationPage = props => {
  const {
    register,
    formState: { errors },
    handleSubmit,
    getValues,
  } = useForm();

  const onSubmit = data => console.log(data);

  return (
    <div className={styles.container}>
      <h3>Account Registration</h3>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.inputField}>
          <label htmlFor="username">Username</label>
          <br />
          <input
            {...register("username", { required: true, minLength: "5", maxLength: "20" })}
            autoComplete="username"
          />
          {errors.username?.type === "required" && <ErrorMessage>Required</ErrorMessage>}
          {errors.username?.type === "minLength" && <ErrorMessage>Must be at least 5 characters</ErrorMessage>}
          {errors.username?.type === "maxLength" && <ErrorMessage>Cannot be over 20 characters</ErrorMessage>}
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
          {errors.password?.type === "minLength" && <ErrorMessage>Must be at least 8 characters</ErrorMessage>}
          {errors.password?.type === "maxLength" && <ErrorMessage>Cannot be over 100 characters</ErrorMessage>}
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
          {errors.confirmPassword?.type === "passwordMatch" && <ErrorMessage>Passwords must match</ErrorMessage>}
        </div>
        <div className={styles.inputField}>
          <label htmlFor="email">Email (Optional)</label>
          <br />
          <input {...register("email")} autoComplete="email" />
          {errors.email ? <ErrorMessage>email is required</ErrorMessage> : null}
          <p className={styles.subtext}>Only used for account recovery</p>
        </div>
        <input type="submit" />
      </form>
    </div>
  );
};
export default RegistrationPage;

const ErrorMessage = props => {
  return <p className={styles.errorMessage}>{props.children}</p>;
};
