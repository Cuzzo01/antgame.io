import { useRef } from "react";

const UploadMapButton = props => {
  const inputFile = useRef(null);
  const fileReader = new FileReader();
  fileReader.onload = e => {
    props.loadMapHandler(JSON.parse(e.target.result));
  };
  const handleMapLoad = e => {
    fileReader.readAsText(e.target.files[0], "UTF-8");
    e.target.value = "";
  };

  return (
    <div style={{ display: "inline" }}>
      <input type="file" ref={inputFile} onChange={handleMapLoad} style={{ display: "none" }} />
      <button style={props.styles} disabled={props.playState} onClick={() => inputFile.current.click()}>
        Load
      </button>
    </div>
  );
};
export default UploadMapButton;
