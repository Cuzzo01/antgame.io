import { Modal, Button } from "react-bootstrap";
import React from "react";

const ChallengeModal = (props) => {
  return (
    <Modal
      show={props.show}
      onHide={() => props.closeModal()}
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header>Challenge Results</Modal.Header>
      <Modal.Body>
        <h5>Challenge:</h5>
        <p>{props.challengeHandler?.challengeName}</p>
        <h5>Score:</h5>
        <p>{props.challengeHandler?.score}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => props.closeModal()}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChallengeModal;
