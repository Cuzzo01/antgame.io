import { useEffect, useState } from "react";
import styles from "./ChallengePage.module.css";
import { getActiveChallenges } from "../../Challenge/ChallengeService";
import AuthHandler from "../../Auth/AuthHandler";
import { Link, useHistory } from "react-router-dom";
import { HomeIcon, TimeIcon } from "../../AntGameHelpers/Icons";
import loaderGif from "../../../assets/thumbnailLoader.gif";
import { getFlag } from "../../Helpers/FlagService";
import DailyCountdown from "../DailyCountdown/DailyCountdown";
import Username from "../../User/Username";

const ChallengeList = () => {
  const [loading, setLoading] = useState(true);
  const [menuList, setMenuList] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(false);
  const history = useHistory();

  useEffect(() => {
    document.title = "Challenge List - AntGame";
    if (!AuthHandler.loggedIn) {
      history.replace({ pathname: "/login", search: "?redirect=/challenge" });
      return;
    }
    const flagPromise = getFlag("show-challenge-list-thumbnails");
    getActiveChallenges().then(async challengeResponse => {
      let seenDaily = false;
      const shouldShowThumbnails = await flagPromise;
      const records = challengeResponse.records;
      let list = [];
      challengeResponse.challenges.forEach(challenge => {
        if (challenge.dailyChallenge && seenDaily === false) {
          setDailyChallenge(
            <DailyChallengeCard
              challenge={challenge}
              record={records[challenge.id]}
              championshipID={challenge.championshipID}
            />
          );
          seenDaily = true;
        } else
          list.push(
            <ChallengeCard
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
      {!loading && dailyChallenge ? dailyChallenge : null}
      <div className={styles.challengeGrid}>
        {loading ?
          null
          : menuList}
      </div>
    </div>
  );
};
export default ChallengeList;

const ChallengeCard = props => {
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  return (
    <div className={styles.challengeGridElement}>
      <div className={styles.topBar}>
        <div className={styles.infoBlock}>
          <div className={styles.challengeInfo}>
            <div className={styles.challengeName}>
              <span>{props.name}</span>
            </div>
            <ChallengeDetails time={props.time} homes={props.homes} />
          </div>
          <div className={styles.records}>
            <div className={styles.challengeWR}>
              WR:
              <WRDisplay wr={props.records?.wr} />
            </div>
            <div className={styles.challengePR}>
              PR:
              <PBDisplay
                pb={props.records?.pb}
                rank={props.records?.rank}
                runs={props.records?.runs}
              />
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

const DailyChallengeCard = ({ challenge, record, championshipID }) => {
  const [showChampionshipLink, setShowChampionshipLink] = useState(null);

  useEffect(() => {
    const getChampionshipFlag = async () => {
      getFlag("show-championship-link")
        .then(flag => {
          setShowChampionshipLink(flag);
        })
        .catch(() => setShowChampionshipLink(false));
    };
    getChampionshipFlag();
  }, []);

  return (
    <div className={styles.dailyChallengeBox}>
      <div className={styles.dailyTitle}>
        <span>
          <strong>
            Daily Challenge - Ends in <DailyCountdown />
          </strong>
        </span>
      </div>
      <div>
        <div className={styles.challengeInfo}>
          <div className={styles.challengeName}>
            <span>{challenge.name}</span>
          </div>
          <ChallengeDetails time={challenge.time} homes={challenge.homes} />
        </div>
        <div className={styles.records}>
          <div className={styles.challengeWR}>
            WR:
            <WRDisplay wr={record?.wr} />
          </div>
          <div className={styles.challengePR}>
            PR:
            <PBDisplay pb={record?.pb} rank={record?.rank} runs={record?.runs} />
          </div>
        </div>
      </div>
      {showChampionshipLink !== null ? (
        <div className={styles.dailyLinks}>
          <ChallengeLink id={"daily"} makeBig={showChampionshipLink} />
          <LeaderboardLink id={"daily"} />
          {showChampionshipLink ? <ChampionshipLink id={championshipID} cols /> : null}
        </div>
      ) : null}
    </div>
  );
};

const WRDisplay = ({ wr }) => {
  if (wr?.score) {
    const wrUsernameLength = wr.username.length;
    return (
      <span>
        {wr.score}-<Username id={wr.id} name={wr.username} />
        {wrUsernameLength < 8 ? (
          <span className={`${styles.smallText} ${styles.age}`}>({wr.age} ago)</span>
        ) : null}
        {wrUsernameLength >= 8 && wrUsernameLength < 12 ? (
          <span className={`${styles.smallText} ${styles.age}`}>({wr.age})</span>
        ) : null}
      </span>
    );
  }
  return "No record";
};

const PBDisplay = ({ pb, rank, runs }) => {
  if (pb) {
    return (
      <span>
        {pb}
        &nbsp;(
        {rank ? (
          <span>
            #<strong>{rank}</strong>,&nbsp;
          </span>
        ) : null}
        {runs} runs)
      </span>
    );
  }
  return "No record";
};

const ChallengeDetails = ({ time, homes }) => {
  return (
    <div className={styles.challengeDetails}>
      <div>
        <TimeIcon />
        &nbsp;{getDisplayTime(time)}
      </div>
      <div>
        <HomeIcon />
        &nbsp;{homes}
      </div>
    </div>
  );
};

const LeaderboardLink = props => {
  return (
    <Link className={styles.challengeLink} to={`/challenge/${props.id}/leaderboard`}>
      Leaderboard
    </Link>
  );
};

const ChampionshipLink = props => {
  return (
    <Link className={styles.challengeLink} to={`/championship/${props.id}`}>
      Championship
    </Link>
  );
};

const ChallengeLink = ({ id, makeBig }) => {
  let className = styles.challengeLink;
  if (makeBig) className += ` ${styles.bigLink}`;
  return (
    <a href={`/challenge/${id}`} className={className}>
      Play
    </a>
  );
};

const getDisplayTime = seconds => {
  const min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  if (sec < 10) sec = "0" + sec;
  return `${min}:${sec}`;
};
