import ReactGA from "react-ga";

const trackingID = "G-J5Z9WSWYGY";

export default function GAInitializer() {
  ReactGA.initialize(trackingID);

  let env = "prod";

  const lowestDomain = window.location.host.split(".")[0].toLowerCase();
  if (lowestDomain === "dev") {
    console.log("in dev mode");
    env = "dev";
  } else if (lowestDomain === "localhost:3000") {
    console.log("in local mode");
    env = "local";
  }

  ReactGA.set({
    env: env,
  });

  return <div />;
}
