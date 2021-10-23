import { useState } from "react";

const UserSelect = props => {
  const [value, setValue] = useState("");

  const handleChange = event => {
    props.onChange(event.target.value);
    setValue(event.target.value);
  };

  return (
    <div className="user-select">
      <select value={value} onChange={handleChange}>
        <option value="" disabled>
          Select query
        </option>
        <option value="recentCreate">Recently Created</option>
        <option value="recentLogin">Recently Logged In</option>
      </select>
    </div>
  );
};
export default UserSelect;
