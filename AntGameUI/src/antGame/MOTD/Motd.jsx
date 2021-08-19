import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { getFlag } from "../Helpers/FlagService";
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
        <Modal show onHide={() => setModalData(false)}>
          <Modal.Header>
            <Modal.Title>{modalData.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className={styles.body} dangerouslySetInnerHTML={{ __html: modalData.text }}></div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setModalData(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      ) : null}
    </div>
  );
};
export default MOTD;
