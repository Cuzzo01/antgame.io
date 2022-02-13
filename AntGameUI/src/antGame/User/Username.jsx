import { useCallback, useState } from "react";
import { useEffect } from "react";
import ReactTooltip from "react-tooltip";
import { TrophyIcon } from "../AntGameHelpers/Icons";
import styles from "./User.module.css";
import BadgeService from "./BadgeService";

const Username = ({ name, id }) => {
  const [badges, setBadges] = useState(false);

  const populateBadges = useCallback(async () => {
    let badges = await BadgeService.getBadges(id);
    while (badges === undefined) badges = await BadgeService.getBadges(id);

    let list = [];
    badges.forEach(badge => {
      const inlineStyles = {};
      if (badge.color === "white") inlineStyles["color"] = "white";

      if (badge.backgroundColor === "gold") inlineStyles["backgroundColor"] = "#d6af36";
      else if (badge.backgroundColor === "silver") inlineStyles["backgroundColor"] = "#a7a7ad";
      else if (badge.backgroundColor === "bronze") inlineStyles["backgroundColor"] = "#a77044";
      else if (badge.backgroundColor === "red") inlineStyles["backgroundColor"] = "#e74c3c";
      else if (badge.backgroundColor === "green") inlineStyles["backgroundColor"] = "#7dcea0";

      let icon = false;
      if (badge.icon === "trophy") icon = <TrophyIcon />;

      list.push(
        <span style={{ ...inlineStyles }} key={badge.name} className={styles.badgeRow}>
          {icon}
          <span>{badge.name}</span>
        </span>
      );
    });

    if (list.length) setBadges(list);
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
    >
      {name}
      <ReactTooltip effect="solid" id={tooltipName} className={styles.tooltip}>
        {badges}
      </ReactTooltip>
    </span>
  );
};
export default Username;
