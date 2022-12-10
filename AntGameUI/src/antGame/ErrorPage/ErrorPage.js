import { useCallback, useEffect, useState } from "react";
import { isApiHealthy } from "../AntApiService";
import styles from "./ErrorPage.module.css";

const ErrorPage = () => {
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  const checkForApiHealthy = useCallback(() => {
    return isApiHealthy().then(isHealthy => setApiOnline(isHealthy));
  }, []);

  useEffect(() => {
    checkForApiHealthy().then(() => {
      setLoading(false);
    });

    const recheckInterval = setInterval(() => checkForApiHealthy(), 60000);

    return () => {
      clearInterval(recheckInterval);
    };
  }, [checkForApiHealthy]);

  return (
    <div className={styles.container}>
      <h1>Error</h1>
      <h4>Whoops, the ants may be having issues.</h4>
      <br />
      {!loading && (
        <>
          <p>Looks like the server is {apiOnline ? "online" : "offline"}</p>
          {apiOnline ? <a href="/">Go home</a> : <a href="/sandbox">Play sandbox mode?</a>}
        </>
      )}
    </div>
  );
};
export default ErrorPage;
