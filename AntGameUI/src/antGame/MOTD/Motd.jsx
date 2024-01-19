import { useEffect, useState } from "react";
import { getFlag } from "../Helpers/FlagService";
import GenericModal from "../Helpers/GenericModal";
import styles from "./Motd.module.css";

const MOTD = () => {
  const [modalData, setModalData] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("checkForMOTD") === "true") {
      getFlag("MotdData")
        .then(data => {
          if (data.display !== false) {
            setModalData(data);
          }
        })
        .catch(e => {
          console.log(e);
        });
      localStorage.removeItem("checkForMOTD");
    }
  }, []);

  return (
    <div>
      {modalData !== false ? (
        <GenericModal
          onHide={() => setModalData(false)}
          title={modalData.title}
          body={<div className={styles.body} dangerouslySetInnerHTML={{ __html: modalData.text }} />}
        />
      ) : null}
    </div>
  );
};
export default MOTD;
