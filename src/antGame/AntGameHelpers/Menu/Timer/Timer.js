import "./Timer.css";

const TimeCounter = (props) => {
  const path = window.location.pathname;
  const shouldLinkHome = path.startsWith("/map");

  const Timer = () => {
    return (
      <h2 className={`timer ${props.active ? "active" : ""}`}>
        {props.time.min}:{props.time.sec}
      </h2>
    );
  };

  return (
    <div style={props.styles}>
      {shouldLinkHome ? (
        <a href="/">
          <Timer />
        </a>
      ) : (
        <Timer />
      )}
    </div>
  );
};
export default TimeCounter;
