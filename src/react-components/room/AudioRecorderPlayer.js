import React, { forwardRef, memo } from "react";
import classNames from "classnames";
import { useIntl, defineMessages } from "react-intl";
import PropTypes from "prop-types";
import styles from "./AudioRecorderPlayer.scss";

const audioRecordingMessages = defineMessages({
  placeholderMessage: {
    id: "audio-recording-modal.placeholder.message",
    defaultMessage: "Not recording"
  },
  placeholderRecording: {
    id: "audio-recording-modal.placeholder.recording",
    defaultMessage: "Recording"
  },
  audioElementNotSupported: {
    id: "audio-recording-modal.audioElement.notSupported",
    defaultMessage: "Your browser does not support the audio element."
  }
});

export const AudioRecorderPlayer = memo(
  forwardRef(({ isRecording, audioSrc, timerDisplay }, ref) => {
    const intl = useIntl();

    if (isRecording || (!isRecording && audioSrc == "")) {
      return (
        <div ref={ref} className={classNames(styles.placeholder)}>
          <p>
            {isRecording
              ? intl.formatMessage(audioRecordingMessages.placeholderRecording)
              : intl.formatMessage(audioRecordingMessages.placeholderMessage)}
            <span>{isRecording ? ", " + timerDisplay : ""}</span>
          </p>
        </div>
      );
    } else {
      return (
        <audio controls ref={ref} src={audioSrc}>
          {intl.formatMessage(audioRecordingMessages.audioElementNotSupported)}
        </audio>
      );
    }
  })
);

AudioRecorderPlayer.propTypes = {
  isRecording: PropTypes.bool,
  audioSrc: PropTypes.string,
  timerDisplay: PropTypes.string
};