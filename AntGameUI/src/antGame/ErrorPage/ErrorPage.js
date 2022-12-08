import { useCallback, useEffect, useState } from "react";
import styles from "./ErrorPage.module.css";

const ErrorPage = () => {
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  const checkForApiHealthy = useCallback(() => {
    return fetch("/api/health")
      .then(res => {
        setApiOnline(res.status === 200);
      })
      .catch(() => false);
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
      <p>Checking API Health...</p>
      {!loading && (
        <>
          <p>Looks like the server is {apiOnline ? "online" : "offline"}</p>
          {apiOnline ? (
            <>
              <a href="/">Go home</a>
            </>
          ) : (
            <>
              <a href="/sandbox">Play sandbox mode?</a>
            </>
          )}
        </>
      )}
    </div>
  );
};
export default ErrorPage;
