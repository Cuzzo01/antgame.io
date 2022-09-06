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
import { YesterdaysDailyCard } from "./YesterdaysDailyCard";

const ChallengeList = () => {
  const InitialList = Array(12).fill(
    <DailyChallengeCard />,
    <ChampionshipCard />,
    <YesterdaysDailyCard />,
    <ChallengeCard showThumbnails loading />
  );

  const [loading, setLoading] = useState(true);
  const [menuList, setMenuList] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(<DailyChallengeCard />);
  const [championshipCard, setChampionshipCard] = useState(<ChampionshipCard />);
  const [yesterdaysDailyCard, setYesterdaysDailyCard] = useState(<YesterdaysDailyCard />);
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
    const shouldShowThumbnails = await thumbnailFlagPromise;
    const records = challengeResponse.records;

    const championshipData = challengeResponse.championshipData;
    if (championshipData) setChampionshipCard(<ChampionshipCard data={championshipData} />);
    else setChampionshipCard();

    const yesterdaysDailyData = challengeResponse.yesterdaysDailyData;
    if (yesterdaysDailyData)
      setYesterdaysDailyCard(<YesterdaysDailyCard data={yesterdaysDailyData} />);
    else setYesterdaysDailyCard();

    let list = [];
    let seenDaily = false;
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

  var isInIframe = window.self !== window.top;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {isInIframe ? (
          <a href="https://antgame.io?ref=iframe-linkout" target="_blank" rel="noreferrer">
            <h2>AntGame.io</h2>
          </a>
        ) : (
          <h2>AntGame.io</h2>
        )}
      </div>
      {loading ? (
        <div className={styles.challengeGrid}>{InitialList}</div>
      ) : (
        <div className={styles.challengeGrid}>
          {dailyChallenge}
          {yesterdaysDailyCard}
          {championshipCard}
          <div className={styles.flexBreak} />
          {menuList}
        </div>
      )}
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
