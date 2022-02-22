import { useCallback, useState } from "react";
import { useEffect } from "react";
import ReactTooltip from "react-tooltip";
import { TrophyIcon } from "../AntGameHelpers/Icons";
import styles from "./User.module.css";
import BadgeService from "./BadgeService";

const Username = ({ name, id }) => {
  const [badges, setBadges] = useState(false);
  const [nameStyles, setNameStyles] = useState({});

  const populateBadges = useCallback(async () => {
    if (id === undefined) return;
    let badges = await BadgeService.getBadges(id);
    while (badges === undefined) badges = await BadgeService.getBadges(id);

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

      if (i === 0 && inlineStyles.color) nameStyles["color"] = inlineStyles.color;
      if (i === 0 && inlineStyles.backgroundColor)
        nameStyles["backgroundColor"] = inlineStyles.backgroundColor;

      let icon = false;
      if (badge.icon === "trophy") icon = <TrophyIcon />;

      list.push(
        <span style={{ ...inlineStyles }} key={badge.name} className={styles.badgeRow}>
          {icon}
          <span>{badge.name}</span>
        </span>
      );
    }

    if (list.length) setBadges(list);
    else setBadges(false);
    if (Object.keys(nameStyles)) setNameStyles(nameStyles);
    else setNameStyles({});
  }, [id]);

  useEffect(() => {
    ReactTooltip.rebuild();
    populateBadges();
  }, [populateBadges]);

  if (badges === false) return <span className={styles.baseBadge}>{name}</span>;

  const tooltipName = `${name}${Math.round(Math.random() * 1e10)}`;
  return (
    <span
      data-tip=""
      data-for={tooltipName}
      data-delay-hide="500"
      className={`${styles.baseBadge} ${styles.active}`}
      style={{ ...nameStyles }}
    >
      {name}
      <ReactTooltip effect="solid" id={tooltipName} className={styles.tooltip}>
        {badges}
      </ReactTooltip>
    </span>
  );
};
export default Username;
