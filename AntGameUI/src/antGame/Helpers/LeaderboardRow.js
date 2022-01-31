import styles from "./GenericStyles.module.css";

const LeaderboardRow = ({ rank, ownRow, name, age, isDaily, pb, noRank }) => {
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
    <div className={`${styles.row} ${placeStyle} ${ownRow ? styles.ownRow : ""}`}>
      <span className={styles.rank}>{noRank ? null : `#${rank}`}</span>
      <span>{name}</span>
      <span className={styles.right}>
        <span className={styles.age}>{age}</span>
        &nbsp;{pb}
      </span>
    </div>
  );
};
export default LeaderboardRow;
