import { Button, Modal } from "react-bootstrap";
import GenericStyles from "./GenericStyles.module.css";

const GenericModal = ({ title, onHide, body, closeMessage }) => {
  return (
    <Modal show onHide={() => onHide()}>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
        <div
          className={`${GenericStyles.divButton} ${GenericStyles.modalClose}`}
          onClick={() => onHide()}
        >
          <span>&times;</span>
        </div>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button onClick={() => onHide()}>{closeMessage ? closeMessage : "Close"}</Button>
      </Modal.Footer>
    </Modal>
  );
};
export default GenericModal;
