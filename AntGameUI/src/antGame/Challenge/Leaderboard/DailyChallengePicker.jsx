import { useEffect, useState } from "react";
import { getDailyChallengeList } from "../ChallengeService";
import styles from "./Leaderboard.module.css";

const DailyChallengePicker = ({ callback, currentID }) => {
  const [selectOptions, setSelectOptions] = useState(false);

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
      setSelectOptions(options);
    });
  }, []);

  const handleChange = event => {
    event.preventDefault();
    callback(event.target.value);
  };

  return (
    <div className={styles.dailyPicker}>
      <span>Other daily challenges:</span>
      <select onChange={handleChange} defaultValue={currentID}>
        {selectOptions}
      </select>
    </div>
  );
};
export default DailyChallengePicker;
