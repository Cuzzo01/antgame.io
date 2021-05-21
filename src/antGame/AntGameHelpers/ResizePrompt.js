const ResizePrompt = (props) => {
  return (
    <div style={{ ...props.styles, ...styles.container }}>
      <button onClick={props.clickHandler}>Resize</button>
      <p style={styles.message}>(clears ants and trails)</p>
    </div>
  );
};
export default ResizePrompt;

const styles = {
  container: {
    display: "inline",
  },
  message: {
    paddingLeft: "5px",
    display: "inline",
  },
};
