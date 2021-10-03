import { useState } from "react";
import styles from "./ConfigDetails.module.css";
import adminStyles from "../AdminStyles.module.css";

const ThumbnailSection = props => {
  const [editable, setEditable] = useState(false);
  const [URLInputValue, setURLInputValue] = useState(props.currentURL);

  const saveEdit = () => {
    props.handleSave(URLInputValue);
    setEditable(false);
  };

  return (
    <div className={styles.thumbnailSection}>
      <div className={styles.thumbnailEdit}>
        <span>Thumbnail Url:</span>
        {editable ? (
          <form onSubmit={() => saveEdit()}>
            <input
              type="text"
              onChange={e => setURLInputValue(e.target.value)}
              value={URLInputValue}
            />
          </form>
        ) : props.currentURL ? (
          <span>{getDisplayURL(props.currentURL)}</span>
        ) : (
          "No URL"
        )}
      </div>
      <div className={adminStyles.rightAlign}>
        {editable ? (
          <div>
            <div
              className={styles.orderEditButton}
              onClick={() => {
                setEditable(false);
                setURLInputValue(props.currentURL);
              }}
            >
              Cancel
            </div>
            <div className={styles.orderEditButton} onClick={() => saveEdit()}>
              Save
            </div>
          </div>
        ) : (
          <div className={styles.orderEditButton} onClick={() => setEditable(true)}>
            Edit
          </div>
        )}
      </div>
    </div>
  );
};
export default ThumbnailSection;

const getDisplayURL = url => {
  // if (url.length < 60) return url
  const urlArr = url.split("/");
  return urlArr.slice(urlArr.length - 2).join("/");
};
