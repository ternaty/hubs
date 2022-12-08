import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { CloseButton } from "../input/CloseButton";
import styles from "./ControlsOverviewModal.scss";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";
import { getLocale } from "../../utils/i18n";

export function ControlsOverviewModal({ onClose }) {
  return (
    <Modal
      title={<FormattedMessage id="controls-overview-modal.title" defaultMessage="Controls Overview" />}
      beforeTitle={<CloseButton onClick={onClose} />}
      className={styles.controlsOverviewModal}
    >
      <Column padding center className={styles.content}>
        {getLocale() != "de" ? (
          <iframe src="https://ternaty.com/en/app-controls-overview/" className={styles.iframe} />
        ) : (
          <iframe src="https://ternaty.com/app-controls-overview/" className={styles.iframe} />
        )}
      </Column>
    </Modal>
  );
}

ControlsOverviewModal.propTypes = {
  onClose: PropTypes.func
};
