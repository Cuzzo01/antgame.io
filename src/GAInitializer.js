import ReactGA from "react-ga";

const trackingID = "UA-197853948-1";

export default function GAInitialize() {
  let env = "prod";
  const lowestDomain = window.location.host.split(".")[0].toLowerCase();
  if (lowestDomain === "dev") {
    env = "dev";
  } else if (lowestDomain === "localhost:3000") {
    env = "local";
  }

  ReactGA.initialize(trackingID, { siteSpeedSamepleRate: 100 });
  ReactGA.set({
    env: env,
  });
  ReactGA.pageview(window.location.pathname);
}
