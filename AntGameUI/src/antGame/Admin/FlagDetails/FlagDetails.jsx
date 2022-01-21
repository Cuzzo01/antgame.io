import { useEffect, useState } from "react";
import { getFlagDetails, updateFlagDetails } from "../AdminService";
import AdminStyles from "../AdminStyles.module.css";
import ExpandList from "../Helpers/ExpandList";
import styles from "./FlagDetails.module.css";

const FlagDetails = props => {
  const [flag, setFlag] = useState({});

  useEffect(() => {
    const id = props.id;
    getFlagDetails(id).then(flagDetails => {
      setFlag(flagDetails);
    });
  }, [props.id]);

  const editCallback = value => {
    const id = props.id;

    updateFlagDetails(id, { value: value }).then(res => {
      setFlag(res);
    });
  };

  return (
    <div>
      <h3>Flag Details</h3>
      <div className={AdminStyles.divSection}>
        <h5>
          <strong>Flag Name</strong>
        </h5>
        <span>{flag.name}</span>
      </div>
      <FlexValueEditDisplay flag={flag} editCallback={editCallback} />
    </div>
  );
};
export default FlagDetails;

const FlexValueEditDisplay = props => {
  const { flag, editCallback } = props;
  const [editSection, setEditSection] = useState(false);

  useEffect(() => {
    const flagType = flag.type;
    const editElement = [];
    if (flagType === "bool") {
      editElement.push(<BoolEdit key={flag.id} flag={flag} editCallback={editCallback} />);
    } else if (flagType === "int") {
      editElement.push(<IntEdit key={flag.id} flag={flag} editCallback={editCallback} />);
    }
    setEditSection(editElement);
  }, [flag, editCallback]);

  return (
    <div>
      <div className={AdminStyles.divSection}>
        <h5>
          <strong>Flag Value</strong>
        </h5>
        <ValueDisplay flag={flag} />
      </div>
      <ExpandList title="Edit Value" itemsToList={editSection} emptyMessage="Value not editable" />
    </div>
  );
};

const ValueDisplay = props => {
  const { flag } = props;
  const [valueToDisplay, setValueToDisplay] = useState("");

  useEffect(() => {
    let display = [];
    switch (flag.type) {
      case "bool":
        flag.value ? display.push("True") : display.push("False");
        break;
      case "int":
        display.push(flag.value);
        break;
      case "string":
        display.push(flag.value);
        break;
      case "object":
        Object.keys(flag.value).forEach(key => {
          const value = flag.value[key];
          const type = flag.fields[key];
          display.push(
            <tr key={value}>
              <td>{key}</td>
              <td>
                <ValueDisplay flag={{ type: type, value: value }} />
              </td>
            </tr>
          );
        });
        display = [
          <div>
            <h6>Flag's type is object. Fields are:</h6>
            <table className={styles.objectTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>{display}</tbody>
            </table>
          </div>,
        ];
        break;
      default:
        display = flag.value;
    }

    setValueToDisplay(display);
  }, [flag]);

  return <span>{valueToDisplay}</span>;
};

const BoolEdit = props => {
  const { flag, editCallback } = props;

  return (
    <div>
      {flag.value ? (
        <button
          className={`${AdminStyles.divButton} ${AdminStyles.redBackground}`}
          onClick={() => editCallback(false)}
        >
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

const IntEdit = props => {
  const { flag, editCallback } = props;
  const [inputValue, setInputValue] = useState(flag.value);

  const saveEdit = () => {
    editCallback(parseInt(inputValue));
  };

  return (
    <div className={styles.intEdit}>
      <span>Value:</span>
      <form
        onSubmit={e => {
          saveEdit();
          e.preventDefault();
        }}
      >
        <input
          type="number"
          step="1"
          onChange={e => setInputValue(e.target.value)}
          value={inputValue}
        />
      </form>
      <div className={`${AdminStyles.divButton} ${styles.divButton}`}>
        <span>Save</span>
      </div>
    </div>
  );
};
