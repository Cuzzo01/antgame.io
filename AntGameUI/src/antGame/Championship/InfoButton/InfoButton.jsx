import { useState } from "react";
import { InfoIcon } from "../../AntGameHelpers/Icons";
import styles from "./InfoButton.module.css";
import GenericModal from "../../Helpers/GenericModal";
import { useEffect } from "react";

const InfoButton = ({ pointMap }) => {
  const [showModal, setShowModal] = useState(false);
  const [pointsTable, setPointsTable] = useState(false);

  useEffect(() => {
    setPointsTable(buildPointTable(pointMap));
  }, [pointMap, setPointsTable]);

  return (
    <span>
      <div className={styles.container}>
        <div className={styles.button} onClick={() => setShowModal(true)}>
          <InfoIcon />
        </div>
      </div>
      {showModal ? (
        <GenericModal
          title={<span className={styles.bold}>The Monthly Championship</span>}
          onHide={() => setShowModal(false)}
          body={
            <div>
              <div className={styles.section}>
                <h5 className={styles.bold}>How it works</h5>
                &#8226;&nbsp;Points in the monthly championship are awarded based on each players
                final leaderboard rank for each daily challenge.
                <br />
                &#8226;&nbsp;Each championship runs for one month. A new championship begins on the
                first of each month.
                <br />
                &#8226;&nbsp;Point breakdowns could change month to month.
              </div>
              <div className={styles.section}>
                <h6 className={styles.bold}>Points Breakdown</h6>
                &#8226;&nbsp;For this month, the point breakdown is:
                <div className={styles.pointsTable}>
                  <table>{pointsTable}</table>
                </div>
                &#8226;&nbsp;Top XX% points are only awarded to those not already receiving points
                for their rank.
              </div>
            </div>
          }
        />
      ) : null}
    </span>
  );
};
export default InfoButton;

const buildPointTable = pointMap => {
  const halfPoint = Math.ceil(pointMap.length / 2);

  const table = [];
  table.push(
    <tr key="head">
      <th>Rank</th>
      <th>Points</th>
      <th>Rank</th>
      <th>Points</th>
    </tr>
  );
  for (let i = 0; i < halfPoint; i++) {
    const pair1Display = getDisplayFromPointObject(pointMap[i]);
    const pair2Display =
      pointMap[i + halfPoint] !== undefined
        ? getDisplayFromPointObject(pointMap[i + halfPoint])
        : false;
    if (pair2Display !== false) {
      table.push(
        <tr key={i}>
          <td>{pair1Display.rank}</td>
          <td className={styles.middleRow}>{pair1Display.points}</td>
          <td>{pair2Display.rank}</td>
          <td>{pair2Display.points}</td>
        </tr>
      );
    } else {
      table.push(
        <tr key={i}>
          <td>{pair1Display.rank}</td>
          <td className={styles.middleRow}>{pair1Display.points}</td>
        </tr>
      );
    }
  }
  return table;
};

const getDisplayFromPointObject = pointObject => {
  const typeIsRank = pointObject.type === "rank";
  return {
    rank: typeIsRank ? `#${pointObject.value}` : `Top ${pointObject.value * 100}%`,
    points: pointObject.points,
  };
};
