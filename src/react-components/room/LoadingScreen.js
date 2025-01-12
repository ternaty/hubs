import React from "react";
import PropTypes from "prop-types";
import { LoadingScreenLayout } from "../layout/LoadingScreenLayout";
import { Spinner } from "../misc/Spinner";
import { useRandomMessageTransition } from "./useRandomMessageTransition";
import SaveConsoleLog from "../../utils/record-log.js";
import qsTruthy from "../../utils/qs_truthy";
import { Button } from "../input/Button";
export function LoadingScreen({ message, infoMessages }) {
  const infoMessage = useRandomMessageTransition(infoMessages);
  return (
    <LoadingScreenLayout
      center={
        <>
          <Spinner />
          <p>{message}</p>
        </>
      }
      bottom={
        <>
          <h3>{infoMessage.heading}</h3>
          <p>{infoMessage.message}</p>
          { qsTruthy("record_log") && <Button preset="basic" onClick={() => SaveConsoleLog()}>Save Logs</Button> }
        </>
      }
    />
  );
}

LoadingScreen.propTypes = {
  message: PropTypes.node,
  infoMessages: PropTypes.arrayOf(
    PropTypes.shape({
      heading: PropTypes.node.isRequired,
      message: PropTypes.node.isRequired
    })
  )
};

LoadingScreen.defaultProps = {
  infoMessages: []
};
