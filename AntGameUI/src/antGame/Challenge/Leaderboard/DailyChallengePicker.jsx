import { useCallback, useEffect, useState } from "react";
import { getDailyChallengeList } from "../ChallengeService";
import styles from "./Leaderboard.module.css";

const DailyChallengePicker = ({ callback, currentID }) => {
  const [selectOptions, setSelectOptions] = useState(false);

  const handleChange = useCallback(
    event => {
      event.preventDefault();
      callback(event.target.value);
    },
    [callback]
  );

  useEffect(() => {
    getDailyChallengeList().then(list => {
      if (list.length === 0) return;
      const options = [];
      list.forEach(challenge => {
        options.push(
          <option key={challenge.id} value={challenge.id}>
            {challenge.name}
          </option>
        );
      });
      setSelectOptions(
        <select onChange={handleChange} defaultValue={currentID}>
          {options}
        </select>
      );
    });
  }, [currentID, handleChange]);

  return (
    <div className={styles.dailyPicker}>
      <span>Other daily challenges:</span>
      {selectOptions ? selectOptions : <div />}
    </div>
  );
};
export default DailyChallengePicker;
