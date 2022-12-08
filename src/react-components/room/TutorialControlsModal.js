import React, { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import styles from "./TutorialControlsModal.scss";
import { BackButton } from "../input/BackButton";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";
import tutorialVideoMP4 from "../../assets/video/tutorial-controls.mp4";
import tutorialVideoWebM from "../../assets/video/tutorial-controls.webm";
import tutorialVideoMP4_DE from "../../assets/video/tutorial-controls_DE.mp4";
import tutorialVideoWebM_DE from "../../assets/video/tutorial-controls_DE.webm";
import { getLocale } from "../../utils/i18n";

export function TutorialControlsModal({ onBack, onContinue, store, ...rest }) {
  const [skipTutorialIsSet, setSkipTutorial] = useState(store.state.preferences.skipEntryTutorial);

  const audioSettings = useCallback(
    (gMediaV, gVoiceV, gSfxV) => {
      store.update({
        preferences: {
          globalMediaVolume: gMediaV,
          globalVoiceVolume: gVoiceV,
          globalSFXVolume: gSfxV
        }
      });
    },
    [store]
  );

  useEffect(() => {
    const tmpMediaVolume = store.state.preferences.globalMediaVolume;
    const tmpVoiceVolume = store.state.preferences.globalVoiceVolume;
    const tmpSfxVolume = store.state.preferences.globalSFXVolume;

    // save current volume settings in store, to restore if people reload while recording dialog is opened
    store.update({
      preferences: {
        tmpMutedGlobalMediaVolume: tmpMediaVolume === undefined ? 100 : tmpMediaVolume,
        tmpMutedGlobalVoiceVolume: tmpVoiceVolume === undefined ? 100 : tmpMediaVolume,
        tmpMutedGlobalSFXVolume: tmpSfxVolume === undefined ? 100 : tmpSfxVolume
      }
    });

    // mute the environment
    audioSettings(0.0, 0.0, 0.0);

    return () => {
      audioSettings(tmpMediaVolume, tmpVoiceVolume, tmpSfxVolume);
    };
  }, []);

  const skipBtnPressed = useCallback(
    () => {
      if (skipTutorialIsSet) store.update({ preferences: { skipEntryTutorial: true } });
      onContinue();
    },
    [skipTutorialIsSet, onContinue, store]
  );

  return (
    <Modal
      title={<FormattedMessage id="tutorial-controls-modal.title" defaultMessage="Tutorial" />}
      beforeTitle={<BackButton onClick={onBack} />}
      className={styles.tutorialControlsModal}
      {...rest}
    >
      <Column padding center className={styles.content}>
        <video playsInline controls autoPlay>
          <source src={getLocale() != "de" ? tutorialVideoMP4 : tutorialVideoMP4_DE} type="video/mp4" />
          <source src={getLocale() != "de" ? tutorialVideoWebM : tutorialVideoWebM_DE} type="video/webm" />
        </video>
        <div className="checkbox-container">
          <input
            id="checkbox-dont-show-again"
            type="checkbox"
            className="checkbox"
            checked={skipTutorialIsSet}
            onChange={e => setSkipTutorial(e.target.checked)}
          />
          <label>
            <FormattedMessage
              id="tutorial-controls-modal.skipTutorialCheckboxLabel"
              defaultMessage="Don't show this tutorial again."
            />
          </label>
        </div>
        <Button preset="accept" onClick={skipBtnPressed}>
          <FormattedMessage id="tutorial-controls-modal.skip" defaultMessage="Skip" />
        </Button>
      </Column>
    </Modal>
  );
}

TutorialControlsModal.propTypes = {
  error: PropTypes.string,
  errorButtonLabel: PropTypes.string,
  onClickErrorButton: PropTypes.func,
  onBack: PropTypes.func,
  onContinue: PropTypes.func,
  store: PropTypes.object
};
