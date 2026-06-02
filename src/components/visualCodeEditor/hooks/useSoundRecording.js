import { useCallback, useRef, useState } from 'react';
import { RECORD_SOUND_OPTION } from '../config';

const useSoundRecording = ({ setSounds, showToast }) => {
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isRecordingSound, setIsRecordingSound] = useState(false);
  const [recordingModalState, setRecordingModalState] = useState('closed');
  const [pendingRecordedSound, setPendingRecordedSound] = useState(null);

  const startSoundRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showToast('Sound recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      recordedChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const url = URL.createObjectURL(blob);
        setPendingRecordedSound({ blob, url });

        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
        setIsRecordingSound(false);
        setRecordingModalState('review');
      };

      recorder.start();
      setIsRecordingSound(true);
      setRecordingModalState('recording');
    } catch (error) {
      showToast('Microphone access is required to record a sound.');
      setRecordingModalState('closed');
    }
  }, [showToast]);

  const stopSoundRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleSoundMenuAction = useCallback((menuAction) => {
    if (menuAction === RECORD_SOUND_OPTION) {
      setRecordingModalState('confirm');
    }
  }, []);

  const closeRecordingModal = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }

    if (pendingRecordedSound?.url) {
      URL.revokeObjectURL(pendingRecordedSound.url);
    }

    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setPendingRecordedSound(null);
    setIsRecordingSound(false);
    setRecordingModalState('closed');
  }, [pendingRecordedSound]);

  const saveRecordedSound = useCallback(() => {
    if (!pendingRecordedSound) return;

    setSounds((prevSounds) => {
      const soundCount = prevSounds.filter(({ type }) => type === 'recorded').length + 1;
      return [
        ...prevSounds,
        {
          id: `recording-${Date.now()}`,
          name: `Recording ${soundCount}`,
          type: 'recorded',
          url: pendingRecordedSound.url,
        },
      ];
    });

    setPendingRecordedSound(null);
    setRecordingModalState('closed');
  }, [pendingRecordedSound, setSounds]);

  return {
    closeRecordingModal,
    handleSoundMenuAction,
    isRecordingSound,
    recordingModalState,
    saveRecordedSound,
    setRecordingModalState,
    startSoundRecording,
    stopSoundRecording,
  };
};

export default useSoundRecording;
