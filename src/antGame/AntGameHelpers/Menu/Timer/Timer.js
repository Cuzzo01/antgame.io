import "./Timer.css";

const TimeCounter = (props) => {
  const onRoot = window.location.pathname === "/";

  const Timer = () => {
    return (
      <h2 className={`timer ${props.active ? "active" : ""}`}>
        {props.time.min}:{props.time.sec}
      </h2>
    );
  };

  return (
    <div style={props.styles}>
      {!onRoot ? (
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
