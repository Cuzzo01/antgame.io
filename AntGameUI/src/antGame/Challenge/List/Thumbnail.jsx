import { useState } from "react";
import styles from "./ChallengePage.module.css";
import loaderGif from "../../../assets/thumbnailLoader.gif";

export const Thumbnail = ({ url, isDaily = false }) => {
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  return (
    <div className={isDaily ? styles.dailyThumbnail : styles.thumbnail}>
      <div style={thumbnailLoading ? { display: "none" } : null}>
        <img
          src={url}
          alt="Map thumbnail"
          onLoad={() => setThumbnailLoading(false)}
          onError={() => setThumbnailLoading("error")}
        />
      </div>
      {thumbnailLoading ? (
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
