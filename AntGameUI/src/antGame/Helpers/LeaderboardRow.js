import Username from "../User/Username";
import styles from "./GenericStyles.module.css";

const LeaderboardRow = ({ rank, ownRow, name, age, pb, noRank, id, skinny = false }) => {
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
  }

  return (
    <div
      className={`${skinny ? styles.skinnyRow : styles.row} ${placeStyle} ${
        ownRow ? styles.ownRow : ""
      }`}
    >
      <span className={styles.rank}>{noRank ? null : `#${rank}`}</span>
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
