import { useCallback, useState } from "react";
import { useEffect } from "react";
import ReactTooltip from "react-tooltip";
import { TrophyIcon } from "../AntGameHelpers/Icons";
import styles from "./User.module.css";
import BadgeService from "./BadgeService";
import { Link } from "react-router-dom";

const Username = ({ name, id, showBorder = true, adminLink = false }) => {
  const [badges, setBadges] = useState(false);
  const [nameStyles, setNameStyles] = useState({});

  const populateBadges = useCallback(async () => {
    if (id === undefined) return;
    let badges = await BadgeService.getBadges(id);

    const list = [];
    const nameStyles = {};
    for (let i = 0; i < badges.length; i++) {
      const badge = badges[i];
      const inlineStyles = {};
      if (badge.color === "white") inlineStyles["color"] = "white";

      if (badge.backgroundColor === "gold") inlineStyles["backgroundColor"] = "#d6af36";
      else if (badge.backgroundColor === "silver") inlineStyles["backgroundColor"] = "#a7a7ad";
      else if (badge.backgroundColor === "bronze") inlineStyles["backgroundColor"] = "#a77044";
      else if (badge.backgroundColor === "red") inlineStyles["backgroundColor"] = "#e74c3c";
      else if (badge.backgroundColor === "green") inlineStyles["backgroundColor"] = "#7dcea0";
      else if (badge.backgroundColor) inlineStyles["backgroundColor"] = badge.backgroundColor;

      if (i === 0 && inlineStyles.backgroundColor) {
        nameStyles["backgroundColor"] = inlineStyles.backgroundColor;
        if (inlineStyles.color) nameStyles["color"] = inlineStyles.color;
      }

      let icon = false;
      if (badge.icon === "trophy") icon = <TrophyIcon />;

      list.push(
        <span
          style={{ ...inlineStyles }}
          key={`${badge.name}-${Math.round(Math.random() * 1e4)}`}
          className={styles.badgeRow}
        >
          {icon}
          <span>{badge.name}</span>
        </span>
      );
    }

    if (badges.length) {
      setBadges(list);
      if (showBorder) nameStyles["border"] = "0.15em solid black";
    } else setBadges(false);
    if (Object.keys(nameStyles)) setNameStyles(nameStyles);
    else setNameStyles({});
  }, [id, showBorder]);

  useEffect(() => {
    ReactTooltip.rebuild();
    populateBadges();
  }, [populateBadges]);

  if (badges === false) {
    return (
      <span className={styles.baseBadge}>
        <Link className={styles.link} to={adminLink ? `/admin/user/${id}` : `/user/${name}`}>
          {name}
        </Link>
      </span>
    );
  }

  const tooltipName = `${name}${Math.round(Math.random() * 1e10)}`;
  return (
    <span
      className={`${styles.baseBadge} ${styles.active}`}
      style={{ ...nameStyles }}
      data-tip=""
      data-for={tooltipName}
      data-delay-show="250"
      data-delay-hide="250"
    >
      <Link className={styles.link} to={adminLink ? `/admin/user/${id}` : `/user/${name}`}>
        {name}
        <ReactTooltip effect="solid" id={tooltipName} className={styles.tooltip}>
          {badges}
        </ReactTooltip>
      </Link>
    </span>
  );
};
export default Username;
