import { useEffect, useState } from "react";
import styles from "./UserPage.module.css";
import { GetUserDetails } from "../UserService";
import { TrophyIcon } from "../../AntGameHelpers/Icons";
import { useHistory } from "react-router-dom";

export const UserPage = ({ username }) => {
  const history = useHistory();
  const [userDetails, setUserDetails] = useState(false);

  useEffect(() => {
    GetUserDetails(username).then(userDetails => {
      document.title = `${userDetails.username} - AntGame.io`;
      setUserDetails(userDetails);
    });
  }, [username]);

  if (!userDetails) return <div />;
  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <h2>{userDetails.username}</h2>
        <h6 title="Join date">{userDetails.joinDate}</h6>
      </div>
      <div className={styles.hr} />
      <div className={styles.section}>
        {userDetails.badges ? (
          <div>
            <h5>Badges</h5>
            <BadgesDisplay badges={userDetails.badges} />
          </div>
        ) : (
          <div className={styles.center}>
            <h4>No Badges</h4>
          </div>
        )}
      </div>
      <div className={styles.hr} />
      <div className={styles.center}>
        <div className={styles.link} onClick={() => history.goBack()}>
          Back
        </div>
      </div>
    </div>
  );
};

const BadgesDisplay = ({ badges }) => {
  const [badgeRows, setBadgeRows] = useState();

  useEffect(() => {
    const rows = [];
    if (badges)
      badges.forEach(badge => {
        rows.push(<BadgeRow badge={badge} key={badge.name} />);
      });
    setBadgeRows(rows);
  }, [badges]);

  return <div className={styles.badgeRows}>{badgeRows}</div>;
};

const BadgeRow = ({ badge }) => {
  const inlineStyles = {};
  if (badge.backgroundColor === "gold") inlineStyles["backgroundColor"] = "#d6af36";
  else if (badge.backgroundColor === "silver") inlineStyles["backgroundColor"] = "#a7a7ad";
  else if (badge.backgroundColor === "bronze") inlineStyles["backgroundColor"] = "#a77044";
  else if (badge.backgroundColor === "red") inlineStyles["backgroundColor"] = "#e74c3c";
  else if (badge.backgroundColor === "green") inlineStyles["backgroundColor"] = "#7dcea0";
  else if (badge.backgroundColor) inlineStyles["backgroundColor"] = badge.backgroundColor;

  let icon = false;
  if (badge.icon === "trophy") icon = <TrophyIcon />;

  return (
    <span
      style={{ ...inlineStyles }}
      key={`${badge.name}-${Math.round(Math.random() * 1e4)}`}
      className={styles.badgeRow}
    >
      {icon}
      <span>{badge.name}</span>
    </span>
  );
};
