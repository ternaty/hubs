import React, { useEffect, useRef, useCallback } from "react";
import { useIntl, defineMessages, FormattedMessage } from "react-intl";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { CloseButton } from "../input/CloseButton";
import { Button } from "../input/Button";
import { Column } from "../layout/Column";
import { useAudioRecorder } from "./useAudioRecorder";
import { AudioRecorderPlayer } from "./AudioRecorderPlayer";
import { useForm } from "react-hook-form";
// import { useMicrophoneStatus } from "./useMicrophoneStatus"; // TODO: implement correctly instead of APP.mediaDevicesManager

const audioRecordingMessages = defineMessages({
  submit: {
    id: "audio-recording-modal.recording.submit",
    defaultMessage: "Submit Recording"
  },
  description: {
    id: "audio-recording-modal.recording.description",
    defaultMessage:
      "Record und upload a voice message for others to hear. The environment is muted and others are not be able to hear you, while you have this dialog opened. After recording you will be able to hear your message before submitting and therefore uploading it. You can re-record your message, as often as you want."
  },
  startrecording: {
    id: "audio-recording-modal.recording.start",
    defaultMessage: "Record"
  },
  stoprecording: {
    id: "audio-recording-modal.recording.stop",
    defaultMessage: "Stop"
  }
});

export function AudioRecorderModal({ scene, store, onClose }) {
  const intl = useIntl();
  const [startRecording, stopRecording, isRecording, audioSrc, audioFile, timerDisplay] = useAudioRecorder();
  const { handleSubmit } = useForm();
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;

  const audioSettings = useCallback(
    (isMicEnabled, gMediaV, gVoiceV, gSfxV) => {
      if (isMicEnabled != APP.mediaDevicesManager.isMicEnabled) {
        APP.mediaDevicesManager.toggleMic();
      }
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

  const onSubmit = () => {
    scene.emit("add_media", audioFile.size > 0 && audioFile);
    onClose();
  };

  useEffect(() => {
    const tmpMicEnabled = APP.mediaDevicesManager.isMicEnabled;
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
    audioSettings(false, 0.0, 0.0, 0.0);

    // save used avatar and set it to "unavailable avatar"
    // const tmpUsedAvatar = store.state.profile.avatarId;
    // store.update({ profile: { avatarId: "JrFMCQ5" } });
    // scene.emit("avatar_updated");

    return () => {
      audioSettings(tmpMicEnabled, tmpMediaVolume, tmpVoiceVolume, tmpSfxVolume);
      // store.update({ profile: { avatarId: tmpUsedAvatar } });
      // scene.emit("avatar_updated");
    };
  }, []);

  return (
    <Modal
      title={<FormattedMessage id="audio-recording-modal.title" defaultMessage="Submit Voice Message" />}
      beforeTitle={<CloseButton onClick={onClose} />}
    >
      <Column as="form" padding center onSubmit={handleSubmit(onSubmit)}>
        <p>{intl.formatMessage(audioRecordingMessages.description)}</p>
        <AudioRecorderPlayer isRecording={isRecording} audioSrc={audioSrc} timerDisplay={timerDisplay} />
        <Button
          preset={isRecording ? "cancel" : "primary"}
          onClick={isRecording ? stopRecording : startRecording}
          rel="noopener noreferrer"
        >
          {intl.formatMessage(
            isRecording ? audioRecordingMessages.stoprecording : audioRecordingMessages.startrecording
          )}
        </Button>
        <Button type="submit" preset="accept" disabled={!audioFile || isRecording}>
          {intl.formatMessage(audioRecordingMessages.submit)}
        </Button>
      </Column>
    </Modal>
  );
}

AudioRecorderModal.propTypes = {
  onClose: PropTypes.func,
  scene: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
};
