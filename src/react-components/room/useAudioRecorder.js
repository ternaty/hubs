import { useEffect, useCallback, useState, useRef } from "react";
import vmsg from "vmsg";
import vmsgWasmFile from "../../vendor/vmsg.wasm";

/**
 * This web audio recorder uses:
 * @author Kagami / https://github.com/Kagami/vmsg : vmsg is a small library for creating voice messages.
 * LAME Project / https://lame.sourceforge.io/ : LAME is a high quality MPEG Audio Layer III (MP3) encoder licensed under the LGPL.
 */

export function useAudioRecorder() {
  const recorderRef = useRef();
  const [isRecording, setIsRecording] = useState(false);
  const [audioSrc, setAudioSrc] = useState("");
  const [audioFile, setAudioFile] = useState();
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;
  const intervalRef = useRef();
  const timerDuration = 180;
  const timerLimitStr = "03:00";
  const [timerDisplay, setTimerDisplay] = useState("00:00 / " + timerLimitStr);

  useEffect(() => {
    recorderRef.current = new vmsg.Recorder({
      wasmURL: vmsgWasmFile
    });
  }, []);

  const stopRecording = useCallback(
    async () => {
      if (isRecordingRef.current) {
        const recorder = recorderRef.current;
        const blob = await recorder.stopRecording();
        setAudioSrc(URL.createObjectURL(blob));
        setAudioFile(new File([blob], "audioMessage.mp3", { type: "audio/mpeg" }));
        setIsRecording(false);
        // reset timer
        setTimerDisplay("00:00 / " + timerLimitStr);
        clearInterval(intervalRef.current);
      }
    },
    [setIsRecording, recorderRef, isRecordingRef]
  );

  const startTimer = useCallback(
    () => {
      let timer = 0,
        minutes,
        seconds;
      intervalRef.current = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        setTimerDisplay(minutes + ":" + seconds + " / " + timerLimitStr);

        if (++timer > timerDuration) {
          timer = 0;
          stopRecording();
          setTimerDisplay("00:00" + " / " + timerLimitStr);
        }
      }, 1000);
    },
    [stopRecording, setTimerDisplay]
  );

  const startRecording = useCallback(
    async () => {
      if (!isRecordingRef.current) {
        const recorder = recorderRef.current;
        try {
          await recorder.initAudio();
          await recorder.initWorker();
          recorder.startRecording();
          startTimer();
          setIsRecording(true);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [setIsRecording, recorderRef, isRecordingRef, startTimer]
  );

  return [startRecording, stopRecording, isRecording, audioSrc, audioFile, timerDisplay];
}
