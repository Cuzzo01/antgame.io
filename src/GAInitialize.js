import ReactGA from "react-ga";

const trackingID = "UA-197853948-1";

export default function GAInitialize() {
  let env = "prod";
  let testMode = false;
  const lowestDomain = window.location.host.split(".")[0].toLowerCase();
  if (lowestDomain === "dev") {
    env = "dev";
  } else if (lowestDomain === "localhost:3000") {
    env = "local";
    testMode = true;
  }

  ReactGA.initialize(trackingID, {
    siteSpeedSampleRate: 100,
    testMode: testMode,
  });
  ReactGA.set({
    dimension1: env,
  });
  ReactGA.pageview(window.location.pathname);
}
