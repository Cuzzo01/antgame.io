import { useEffect, useState } from "react";
import styles from "./ChallengePage.module.css";
import { getActiveChallenges, getPublicActiveChallenges } from "../../Challenge/ChallengeService";
import AuthHandler from "../../Auth/AuthHandler";
import { Link, useHistory } from "react-router-dom";
import { HomeIcon, TimeIcon } from "../../AntGameHelpers/Icons";
import loaderGif from "../../../assets/thumbnailLoader.gif";
import { getFlag } from "../../Helpers/FlagService";
import DailyCountdown from "../DailyCountdown/DailyCountdown";
import Username from "../../User/Username";

const ChallengeList = () => {
  const InitialList = Array(12).fill(<ChallengeCard showThumbnails loading />);

  const [loading, setLoading] = useState(true);
  const [menuList, setMenuList] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(<DailyChallengeCard />);
  const history = useHistory();

  useEffect(() => {
    document.title = "AntGame.io";
    const thumbnailFlagPromise = getFlag("show-challenge-list-thumbnails");
    if (AuthHandler.loggedIn && !AuthHandler.isAnon) {
      getActiveChallenges().then(challengeResponse =>
        setData({ challengeResponse, thumbnailFlagPromise })
      );
    } else {
      getPublicActiveChallenges().then(challengeResponse =>
        setData({ challengeResponse, thumbnailFlagPromise })
      );
    }
  }, [history]);

  const setData = async ({ challengeResponse, thumbnailFlagPromise }) => {
    let seenDaily = false;
    const shouldShowThumbnails = await thumbnailFlagPromise;
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
      } else {
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
      }
    });
    if (!seenDaily) setDailyChallenge(false);
    setMenuList(list);
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>AntGame.io - Challenges</h2>
      </div>
      {dailyChallenge}
      <div className={styles.challengeGrid}>{loading ? InitialList : menuList}</div>
    </div>
  );
};
export default ChallengeList;

const ChallengeCard = ({
  name,
  time,
  homes,
  records,
  id,
  showThumbnails,
  thumbnailURL,
  loading,
}) => {
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  return (
    <div className={styles.challengeGridElement}>
      <div className={styles.topBar}>
        <div className={styles.infoBlock}>
          <div className={styles.challengeInfo}>
            <div className={styles.challengeName}>
              <span>{name}</span>
            </div>
            <ChallengeDetails time={time} homes={homes} />
          </div>
          <div className={styles.records}>
            <div className={styles.challengeWR}>
              WR:
              <WRDisplay wr={records?.wr} />
            </div>
            <div className={styles.challengePR}>
              PR:
              <PBDisplay pb={records?.pb} rank={records?.rank} runs={records?.runs} />
            </div>
          </div>
        </div>
        <div className={styles.challengeButtons}>
          <ChallengeLink id={id} />
          <LeaderboardLink id={id} />
        </div>
      </div>
      {showThumbnails ? (
        <div className={styles.thumbnail}>
          <div
            className={styles.thumbnailContainer}
            style={thumbnailLoading ? { display: "none" } : null}
          >
            <img
              src={thumbnailURL}
              alt="Map thumbnail"
              onLoad={() => setThumbnailLoading(false)}
              onError={() => setThumbnailLoading("error")}
            />
          </div>
          {thumbnailLoading ? (
            <div className={styles.thumbnailLoader}>
              {loading || (thumbnailURL && thumbnailLoading !== "error") ? (
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
            <span>{challenge?.name}</span>
          </div>
          <ChallengeDetails time={challenge?.time} homes={challenge?.homes} />
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
        {runs} run{runs > 1 ? "s" : null})
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
  if (!seconds) return "00:00";
  const min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  if (sec < 10) sec = "0" + sec;
  return `${min}:${sec}`;
};
