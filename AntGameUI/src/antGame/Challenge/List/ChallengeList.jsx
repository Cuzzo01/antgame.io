import { useEffect, useState } from "react";
import styles from "./ChallengePage.module.css";
import { getActiveChallenges, getPublicActiveChallenges } from "../../Challenge/ChallengeService";
import AuthHandler from "../../Auth/AuthHandler";
import { useHistory } from "react-router-dom";
import { getFlag } from "../../Helpers/FlagService";
import { DailyChallengeCard } from "./DailyChallengeCard";
import { ChallengeDetails, ChallengeLink, LeaderboardLink, PBDisplay, WRDisplay } from "./Helpers";
import { Thumbnail } from "./Thumbnail";
import { ChampionshipCard } from "./ChampionshipCard";

const ChallengeList = () => {
  const InitialList = Array(12).fill(<ChallengeCard showThumbnails loading />);

  const [loading, setLoading] = useState(true);
  const [menuList, setMenuList] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(<DailyChallengeCard />);
  const [championshipCard, setChampionshipCard] = useState(<ChampionshipCard />);
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
            thumbnailURL={challenge.thumbnailURL}
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
      <div className={styles.bigCards}>
        <span>{dailyChallenge}</span>
        <span>{championshipCard}</span>
      </div>
      <div className={styles.challengeGrid}>{loading ? InitialList : menuList}</div>
    </div>
  );
};
export default ChallengeList;

const ChallengeCard = ({ name, time, homes, records, id, showThumbnails, thumbnailURL }) => {
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
      {showThumbnails ? <Thumbnail url={thumbnailURL} /> : null}
    </div>
  );
};
