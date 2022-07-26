import styles from "./ChallengePage.module.css";
import DailyCountdown from "../DailyCountdown/DailyCountdown";
import { useEffect, useState } from "react";
import { getFlag } from "../../Helpers/FlagService";
import {
  ChallengeDetails,
  ChallengeLink,
  ChampionshipLink,
  LeaderboardLink,
  PBDisplay,
  WRDisplay,
} from "./Helpers";
import { Thumbnail } from "./Thumbnail";

export const DailyChallengeCard = ({ challenge, record, championshipID, thumbnailURL }) => {
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
      <div className={styles.dailyThumbnail}>
        {/* {thumbnailURL && <img src={thumbnailURL} alt="Map thumbnail" />} */}
        {thumbnailURL && <Thumbnail isDaily url={thumbnailURL} />}
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
