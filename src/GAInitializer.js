import ReactGA from "react-ga";

const trackingID = "G-J5Z9WSWYGY";

export default function GAInitializer() {
  ReactGA.initialize(trackingID);

  let env = "prod";

  const lowestDomain = window.location.host.split(".")[0].toLowerCase();
  if (lowestDomain === "dev") {
    env = "dev";
  } else if (lowestDomain === "localhost:3000") {
    env = "local";
  }

  ReactGA.set({
    env: env,
  });

  return <div />;
}
