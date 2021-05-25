import ReactGA from "react-ga";

const trackingID = "G-J5Z9WSWYGY";

export default function GAInitializer() {
  ReactGA.initialize(trackingID);

  return <div />;
}
