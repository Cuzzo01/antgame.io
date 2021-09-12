import { useEffect, useState } from "react";
import styles from "./ChallengePage.module.css";
import { getActiveChallenges } from "../../Challenge/ChallengeService";
import AuthHandler from "../../Auth/AuthHandler";
import { Link, useHistory } from "react-router-dom";
import { HomeIcon, TimeIcon } from "../../AntGameHelpers/Icons";
import loaderGif from "../../../assets/thumbnailLoader.gif";
import { getFlag } from "../../Helpers/FlagService";

const ChallengeList = () => {
  const [loading, setLoading] = useState(true);
  const [menuList, setMenuList] = useState([]);
  const history = useHistory();

  useEffect(() => {
    document.title = "Challenge List - AntGame";
    if (!AuthHandler.loggedIn) {
      history.replace({ pathname: "/login", search: "?redirect=/challenge" });
      return;
    }
    const flagPromise = getFlag("show-challenge-list-thumbnails");
    getActiveChallenges().then(async challengeResponse => {
      const shouldShowThumbnails = await flagPromise;
      const records = challengeResponse.records;
      let list = [];
      challengeResponse.challenges.forEach(challenge => {
        list.push(
          <ListItem
            key={challenge.id}
            name={challenge.name}
            records={records[challenge.id]}
            id={challenge.id}
            time={challenge.time}
            homes={challenge.homes}
            showThumbnails={shouldShowThumbnails}
            thumbnailURL={challenge.thumbnailURL}
          />
        );
      });
      setMenuList(list);
      setLoading(false);
    });
  }, [history]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Challenges</h2>
      </div>
      {loading ? null : <div className={styles.challengeGrid}>{menuList}</div>}
    </div>
  );
};
export default ChallengeList;

const ListItem = props => {
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  const wrUsernameLength = props.records.wr?.username.length;

  return (
    <div className={styles.challengeGridElement}>
      <div className={styles.topBar}>
        <div className={styles.infoBlock}>
          <div className={styles.challengeInfo}>
            <div className={styles.challengeName}>
              <span>{props.name}</span>
            </div>
            <div className={styles.challengeDetails}>
              <div>
                <TimeIcon />
                &nbsp;{getDisplayTime(props.time)}
              </div>
              <div>
                <HomeIcon />
                &nbsp;{props.homes}
              </div>
            </div>
          </div>
          <div className={styles.records}>
            <div className={styles.challengeWR}>
              <span>
                WR:
                {props.records.wr ? (
                  <span>
                    {props.records.wr.score}-{props.records.wr.username}
                    {wrUsernameLength < 10 ? (
                      <span className={`${styles.smallText} ${styles.age}`}>({props.records.wr.age} ago)</span>
                    ) : null}
                    {wrUsernameLength > 9 && wrUsernameLength < 13 ? (
                      <span className={styles.smallText}>&nbsp;({props.records.wr.age})</span>
                    ) : null}
                  </span>
                ) : (
                  "No record"
                )}
              </span>
            </div>
            <div className={styles.challengePR}>
              PR:
              {props.records.pb ? (
                <span>
                  {props.records.pb}
                  &nbsp;(
                  {props.records.rank ? (
                    <span>
                      #<strong>{props.records.rank}</strong>,&nbsp;
                    </span>
                  ) : null}
                  {props.records.runs} runs)
                </span>
              ) : (
                "No record"
              )}
            </div>
          </div>
        </div>
        <div className={styles.challengeButtons}>
          <ChallengeLink id={props.id} />
          <LeaderboardLink id={props.id} />
        </div>
      </div>
      {props.showThumbnails ? (
        <div className={styles.thumbnail}>
          <div
            className={styles.thumbnailContainer}
            style={thumbnailLoading ? { display: "none" } : null}
          >
            <img
              src={props.thumbnailURL}
              alt="Map thumbnail"
              onLoad={() => setThumbnailLoading(false)}
              onError={() => setThumbnailLoading("error")}
            />
          </div>
          {thumbnailLoading ? (
            <div className={styles.thumbnailLoader}>
              {props.thumbnailURL && thumbnailLoading !== "error" ? (
                <img src={loaderGif} alt="Loader" />
              ) : (
                <div>No Thumbnail</div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const LeaderboardLink = props => {
  return (
    <Link className={styles.challengeLink} to={`/challenge/leaderboard/${props.id}`}>
      Leaderboard
    </Link>
  );
};

const ChallengeLink = props => {
  return (
    <a href={`/challenge/${props.id}`} className={styles.challengeLink}>
      Play
    </a>
  );
};

const getDisplayTime = seconds => {
  // debugger
  const min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  if (sec < 10) sec = "0" + sec;
  return `${min}:${sec}`;
};
