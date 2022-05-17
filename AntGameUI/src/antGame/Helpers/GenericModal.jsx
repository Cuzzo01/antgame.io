import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import GenericStyles from "./GenericStyles.module.css";

const GenericModal = props => {
  const [modalAttributes, setModalAttributes] = useState({});

  useEffect(() => {
    let modalAttr = {};
    if (props.staticBackdrop) modalAttr.backdrop = "static";

    setModalAttributes(modalAttr);
  }, [props.staticBackdrop]);

  return (
    <Modal show onHide={() => props.onHide()} {...modalAttributes}>
      <Modal.Header>
        <Modal.Title>{props.title}</Modal.Title>
        <div
          className={`${GenericStyles.divButton} ${GenericStyles.modalClose}`}
          onClick={() => props.onHide()}
        >
          <span>&times;</span>
        </div>
      </Modal.Header>
      <Modal.Body>{props.body}</Modal.Body>
      <Modal.Footer>
        <Button onClick={() => props.onHide()}>
          {props.closeMessage ? props.closeMessage : "Close"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
export default GenericModal;
