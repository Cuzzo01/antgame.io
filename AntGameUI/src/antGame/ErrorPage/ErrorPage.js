import styles from "./ErrorPage.module.css";

const ErrorPage = () => {
  return (
    <div className={styles.container}>
      <h1>Error</h1>
      <h4>Whoops, I probably broke something.</h4>
      <a href="/">Go Home</a>
    </div>
  );
};
export default ErrorPage;
