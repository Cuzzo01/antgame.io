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
  return (
    <div className={`${styles.bigCard} ${styles.dailyChallengeBox}`}>
      <div className={styles.dailyTitle}>
        <span>
          <strong>
            Daily Challenge - Ends in <DailyCountdown />
          </strong>
        </span>
      </div>
      {thumbnailURL && <Thumbnail isDaily url={thumbnailURL} />}
      <div className={styles.topBar}>
        <div className={styles.infoBlock}>
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
        <div className={styles.challengeButtons}>
          <ChallengeLink id={"daily"} />
          <LeaderboardLink id={"daily"} />
        </div>
      </div>
    </div>
  );
};
