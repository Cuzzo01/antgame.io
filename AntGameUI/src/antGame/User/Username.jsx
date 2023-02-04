import { useCallback, useState } from "react";
import { useEffect } from "react";
import ReactTooltip from "react-tooltip";
import { TrophyIcon } from "../AntGameHelpers/Icons";
import styles from "./User.module.css";
import BadgeService from "./BadgeService";
import GenericModal from "../Helpers/GenericModal";
import { UserPage } from "./UserPage/UserPage";
import { ConditionalWrapper } from "../Helpers/ConditionalWrapper";

const Username = ({ name, id, showBorder = true, adminLink = false }) => {
  const [badges, setBadges] = useState(false);
  const [nameStyles, setNameStyles] = useState({});
  const [showUserPage, setShowUserPage] = useState(false);

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

  const tooltipName = `${name}${Math.round(Math.random() * 1e10)}`;
  return (
    <ConditionalWrapper
      condition={adminLink}
      wrapper={children => (
        <a className={styles.adminLink} href={`/admin/user/${id}`}>
          {children}
        </a>
      )}
    >
      <span
        className={`${styles.baseBadge} ${badges.length ? styles.active : ""}`}
        style={{ ...nameStyles }}
        data-tip=""
        data-for={tooltipName}
        data-delay-show="250"
        data-delay-hide="250"
        onClick={adminLink ? undefined : () => setShowUserPage(true)}
      >
        {name}
        <ReactTooltip effect="solid" id={tooltipName} className={styles.tooltip}>
          {badges}
        </ReactTooltip>
      </span>
      {showUserPage && (
        <GenericModal
          body={<UserPage username={name} />}
          onHide={() => {
            setShowUserPage(false);
          }}
        />
      )}
    </ConditionalWrapper>
  );
};
export default Username;
