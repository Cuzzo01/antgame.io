import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isApiHealthy } from "../AntApiService";

export const HomeLink = () => {
  const [apiOnline, setApiOnline] = useState(true);

  const checkForApiHealthy = useCallback(() => {
    isApiHealthy().then(isHealthy => setApiOnline(isHealthy));
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
