import { useState } from "react";
import AdminStyles from "../AdminStyles.module.css";

export const BoolEdit = props => {
  const { flag, editCallback } = props;

  return (
    <div>
      {flag.value ? (
        <button className={`${AdminStyles.divButton} ${AdminStyles.redBackground}`} onClick={() => editCallback(false)}>
          Set False
        </button>
      ) : (
        <button
          className={`${AdminStyles.greenBackground} ${AdminStyles.divButton}`}
          onClick={() => editCallback(true)}
        >
          Set True
        </button>
      )}
    </div>
  );
};

export const IntEdit = ({ value, editCallback }) => {
  const [inputValue, setInputValue] = useState(value);

  const saveEdit = () => {
    editCallback(parseInt(inputValue));
  };

  return (
    <div className={AdminStyles.textEdit}>
      <span>Value:</span>
      <form
        id="edit-form"
        onSubmit={e => {
          saveEdit();
          e.preventDefault();
        }}
      >
        <input type="number" step="1" onChange={e => setInputValue(e.target.value)} value={inputValue} />
      </form>
      <div
        className={`${AdminStyles.divButton} ${AdminStyles.saveButton}`}
        onClick={e => {
          document.getElementById("edit-form").requestSubmit();
          e.preventDefault();
        }}
      >
        <span>Save</span>
      </div>
    </div>
  );
};

export const StringEdit = ({ value, editCallback, label }) => {
  const [inputValue, setInputValue] = useState(value);

  const saveEdit = () => {
    editCallback(inputValue);
  };

  return (
    <div className={AdminStyles.textEdit}>
      <span>{label ? label : "Value"}:</span>
      <form
        id="edit-form"
        onSubmit={e => {
          saveEdit();
          e.preventDefault();
        }}
      >
        <input type="text" onChange={e => setInputValue(e.target.value)} value={inputValue} />
      </form>
      <div
        className={`${AdminStyles.divButton} ${AdminStyles.saveButton}`}
        onClick={e => {
          document.getElementById("edit-form").requestSubmit();
          e.preventDefault();
        }}
      >
        Save
      </div>
    </div>
  );
};
