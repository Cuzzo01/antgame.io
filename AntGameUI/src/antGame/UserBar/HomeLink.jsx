import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const HomeLink = () => {
  const [apiOnline, setApiOnline] = useState(true);

  const checkForApiHealthy = useCallback(() => {
    return fetch("/api/health")
      .then(res => {
        const isApiOnline = res.status === 200;
        setApiOnline(isApiOnline);
        return isApiOnline;
      })
      .catch(() => false);
  }, []);

  useEffect(() => {
    checkForApiHealthy();

    let recheckInterval;
    if (!apiOnline) {
      recheckInterval = setInterval(() => checkForApiHealthy(), 60000);
    }

    return () => {
      if (recheckInterval) clearInterval(recheckInterval);
    };
  }, [checkForApiHealthy, apiOnline]);

  return <>{apiOnline ? <Link to="/">Home</Link> : <p>Server Offline</p>}</>;
};
