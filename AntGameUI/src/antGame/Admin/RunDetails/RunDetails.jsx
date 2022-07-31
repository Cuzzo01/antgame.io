import { useEffect, useState } from "react";
import { getRunDetails, markRunForVerification } from "../AdminService";
import styles from "./RunDetails.module.css";
import adminStyles from "../AdminStyles.module.css";
import { GetTimeString } from "../Helpers/FunctionHelpers";
import { Button } from "react-bootstrap";
import Username from "../../User/Username";

const RunDetails = props => {
  const [details, setDetails] = useState(false);
  const [tagList, setTagList] = useState(false);

  useEffect(() => {
    document.title = "Run Details";
    if (details === false)
      getRunDetails(props.id).then(details => {
        setDetails(details);
      });
  }, [props.id, details]);

  useEffect(() => {
    if (details.tags && details.tags.length) {
      const tagList = [];
      for (let i = 0; i < details.tags.length; i++) {
        const tag = details.tags[i];
        tagList.push(getTagRow(tag));
      }
      setTagList(tagList);
    }
  }, [details]);

  const markForVerification = id => {
    markRunForVerification(id).then(() => setDetails(false));
  };

  return (
    <div>
      {details ? (
        <div>
          <div className={adminStyles.divSection}>
            <h5 className={adminStyles.bold}>
              {details.name} - {details.score}
            </h5>
            <br />
            <strong>Username:</strong>&nbsp;
            <Username id={details.userID} name={details.username} adminLink showBorder={false} />
            <br />
            <strong>ClientID:</strong>&nbsp;{details.clientID}
          </div>
          <div className={adminStyles.divSection}>
            <h5 className={adminStyles.bold}>Details</h5>
            <strong>Homes:</strong>&nbsp;{details.details.homeLocations.length}
            <br />
            <strong>Snapshots:</strong>&nbsp;
            {details.details.snapshots ? details.details.snapshots.length : "None"}
          </div>
          <div className={adminStyles.divSection}>
            <h5 className={adminStyles.bold}>Timing</h5>
            {details.details.seedCreateDate && (
              <div className={styles.timeRow}>
                <strong>Seed Create:</strong>&nbsp;
                {GetTimeString(details.details.seedCreateDate)}
              </div>
            )}
            <div className={styles.timeRow}>
              <strong>Game Start:</strong>&nbsp;
              {GetTimeString(getDateFromMilliseconds(details.details.timing.SystemStartTime))}
            </div>
            <div className={styles.timeRow}>
              <strong>Game Stop:</strong>&nbsp;
              {GetTimeString(getDateFromMilliseconds(details.details.timing.SystemStopTime))}
            </div>
            <div className={styles.timeRow}>
              <strong>Submission Time:</strong>&nbsp;{GetTimeString(details.submissionTime)}
            </div>
            {details.verification?.startTime && (
              <div className={styles.timeRow}>
                <strong>Verification Start:</strong>&nbsp;
                {GetTimeString(details.verification.startTime)}
              </div>
            )}
            {details.verification?.finishTime && (
              <div className={styles.timeRow}>
                <strong>Verification Finish:</strong>&nbsp;
                {GetTimeString(details.verification.finishTime)}
              </div>
            )}
          </div>
          <div className={adminStyles.divSection}>
            <h5 className={adminStyles.bold}>Tags</h5>
            {tagList ? tagList : "No tags"}
          </div>
          <div className={adminStyles.divSection}>
            <h5>Actions</h5>
            <Button
              onClick={() => markForVerification(props.id)}
              disabled={details.toVerify || details.verification}
            >
              Verify
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default RunDetails;

const getDateFromMilliseconds = mili => {
  const date = new Date();
  date.setTime(mili);
  return date;
};

const getTagRow = tag => {
  const type = tag.type;

  return (
    <div className={styles.tagRow} key={type}>
      {type === "pr" ? (
        <div className={adminStyles.greenText}>
          <strong>Personal Record</strong>
          &nbsp;RunCount: {tag.metadata.runNumber}
        </div>
      ) : null}
      {type === "wr" ? (
        <div className={adminStyles.purpleText}>
          <strong>World Record</strong>
        </div>
      ) : null}
      {type === "failed verification" ? (
        <div className={adminStyles.redBackground}>
          <strong>Failed Verification</strong>
          <br />
          <span className={adminStyles.smallText}>{tag.metadata.reason}</span>
        </div>
      ) : null}
      {type === "falsely claimed pb" ? (
        <div className={adminStyles.redBackground}>
          <strong>Falsely claimed PB</strong>
        </div>
      ) : null}
      {type === "random snapshot save" ? (
        <div className={adminStyles.yellowBackground}>
          <strong>Random Snapshot Save</strong>
        </div>
      ) : null}
      {type === "run verified" ? (
        <div className={adminStyles.verified}>
          <strong>Verified</strong>
        </div>
      ) : null}
    </div>
  );
};
