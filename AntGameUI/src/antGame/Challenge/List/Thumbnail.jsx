import { useState } from "react";
import styles from "./ChallengePage.module.css";
import loaderGif from "../../../assets/thumbnailLoader.gif";
import { Link } from "react-router-dom";

export const Thumbnail = ({ url, isDaily = false }) => {
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  return (
    <div className={`${styles.thumbnail} ${isDaily && styles.dailyThumbnail}`}>
      <div
        className={styles.thumbnailContainer}
        style={thumbnailLoading ? { display: "none" } : null}
      >
        <img
          src={url}
          alt="Map thumbnail"
          onLoad={() => setThumbnailLoading(false)}
          onError={() => setThumbnailLoading("error")}
        />
      </div>
      {thumbnailLoading && !isDaily ? (
        <div className={styles.thumbnailLoader}>
          {!url || thumbnailLoading === "error" ? (
            <div>No Thumbnail</div>
          ) : (
            <img src={loaderGif} alt="Loader" />
          )}
        </div>
      ) : null}
    </div>
  );
};
