import { useEffect, useState } from "react";
import Username from "../User/Username";
import styles from "./GenericStyles.module.css";

const LeaderboardRow = ({ rank, ownRow, name, age, pb, noRank, id, skinny = false, rankLink }) => {
  const [containerStyles, setContainerStyles] = useState();
  const [rankDisplay, setRankDisplay] = useState();

  useEffect(() => {
    let placeStyle = "";
    if (!noRank) {
      switch (rank) {
        case 1:
          placeStyle += styles.first;
          break;
        case 2:
          placeStyle += styles.second;
          break;
        case 3:
          placeStyle += styles.third;
          break;
        default:
          break;
      }
      if (rankLink) {
        setRankDisplay(
          <span className={styles.link} onClick={() => rankLink()}>
            #{rank}
          </span>
        );
      } else {
        setRankDisplay(`#${rank}`);
      }
    }

    let conStyles = placeStyle + " ";
    if (ownRow) conStyles += styles.ownRow + " ";
    if (skinny) conStyles += styles.skinnyRow + " ";
    else conStyles += styles.row + " ";
    setContainerStyles(conStyles);
  }, [noRank, ownRow, rank, skinny, rankLink]);

  return (
    <div className={containerStyles}>
      <span className={styles.rank}>{rankDisplay}</span>
      {id ? (
        <div>
          <Username id={id} name={name} />
        </div>
      ) : (
        <span>{name}</span>
      )}
      <span className={styles.right}>
        <span className={styles.age}>{age}</span>
        &nbsp;{pb}
      </span>
    </div>
  );
};
export default LeaderboardRow;
