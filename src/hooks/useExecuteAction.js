import { useCallback } from 'react';
import {
  MOVE_X, MOVE_Y, TURN_RIGHT, TURN_LEFT, GOTO, GOTO_RANDOM,
  POINT_IN_DIRECTION, POINT_TOWARDS_RANDOM, SAY, THINK,
  SAY_TIMER, THINK_TIMER, CHANGE_SIZE_TO, CHANGE_SIZE_BY,
  CHANGE_COLOR, CHANGE_BACKDROP, HIDE, SHOW, PLAY_SOUND, SET_VOLUME, CHANGE_VOLUME_BY, CLEAR_ALL_SOUNDS,
  BROADCAST_MESSAGE_FOR,
} from '../constants/ActionTypes';

const clampVolume = (value) => {
  const volume = parseInt(value, 10);
  if (Number.isNaN(volume)) return 100;
  return Math.min(100, Math.max(0, volume));
};

const parseVolumeDelta = (value) => {
  const delta = parseInt(value, 10);
  return Number.isNaN(delta) ? 0 : delta;
};

const stopAllSounds = (activeAudiosRef) => {
  activeAudiosRef.current.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeAudiosRef.current = [];
};

const parseDuration = (value, fallback = 2) => {
  const duration = parseFloat(value);
  return Number.isNaN(duration) ? fallback : Math.max(0, duration);
};

const playSoundToCompletion = (sound, soundVolume, activeAudiosRef) => {
  if (!sound?.url) return Promise.resolve();

  return new Promise((resolve) => {
    const audio = new Audio(sound.url);
    audio.volume = clampVolume(soundVolume) / 100;
    activeAudiosRef.current.push(audio);

    const finish = () => {
      audio.removeEventListener('ended', finish);
      audio.removeEventListener('error', finish);
      activeAudiosRef.current = activeAudiosRef.current.filter((activeAudio) => activeAudio !== audio);
      resolve();
    };

    audio.addEventListener('ended', finish);
    audio.addEventListener('error', finish);

    audio.play().catch(finish);
  });
};

const VISUAL_ACTION_DELAY_MS = 300;

const waitForNextPaint = () => (
  new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      setTimeout(resolve, 0);
      return;
    }

    window.requestAnimationFrame(() => resolve());
  })
);

const waitForVisualAction = async () => {
  await waitForNextPaint();
  await new Promise((resolve) => {
    setTimeout(resolve, VISUAL_ACTION_DELAY_MS);
  });
};

const getBroadcastMessageValue = (value) => (
  typeof value === 'object' && value !== null ? (value.message || 'Hello!') : (value || 'Hello!')
);

const useExecuteAction = () => {
  return useCallback(async (block, sounds, soundVolume, activeAudiosRef, setSpriteState, setSpeechBubble, setSpriteColor, setBackdropValue, setSoundVolume, onBroadcast, runtimeControls = {}) => {
    const shouldAbort = runtimeControls.shouldAbort || (() => false);
    const waitForMs = runtimeControls.waitForMs || (async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return true;
    });

    if (shouldAbort()) {
      return;
    }

    if (block.action === PLAY_SOUND) {
      const sound = sounds.find(({ id }) => id === block.value);
      await playSoundToCompletion(sound, soundVolume, activeAudiosRef);
      return;
    }

    if (block.action === SAY || block.action === THINK) {
      setSpeechBubble({ message: block.value || (block.action === SAY ? 'Hello!' : 'Hmm...'), isThinking: block.action === THINK });
      await waitForMs(2000);
      setSpeechBubble({ message: '', isThinking: false });
      return;
    }

    if (block.action === SAY_TIMER || block.action === THINK_TIMER) {
      setSpeechBubble({
        message: block.value?.message || (block.action === SAY_TIMER ? 'Hello!' : 'Hmm...'),
        isThinking: block.action === THINK_TIMER,
      });
      await waitForMs(parseDuration(block.value?.duration) * 1000);
      setSpeechBubble({ message: '', isThinking: false });
      return;
    }

    if (block.action === BROADCAST_MESSAGE_FOR) {
      if (shouldAbort()) {
        return;
      }
      await Promise.resolve(onBroadcast?.(getBroadcastMessageValue(block.value)));
      return;
    }

    await new Promise((resolve) => {
      setSpriteState((prevState) => {
        let newState = { ...prevState };

        switch (block.action) {
          case MOVE_X:
            newState.x += parseInt(block.value, 10);
            break;
          case MOVE_Y:
            newState.y -= parseInt(block.value, 10); 
            break;
          case TURN_RIGHT:
            newState.rotation += parseInt(block.value, 10);
            break;
          case TURN_LEFT:
            newState.rotation -= parseInt(block.value, 10);
            break;
          case GOTO:
            newState.x = block.value[0];
            newState.y = -block.value[1];  
            break;
          case GOTO_RANDOM:
            newState.x = Math.random() * window.innerWidth;
            newState.y = Math.random() * window.innerHeight;
            break;
          case POINT_IN_DIRECTION:
            newState.rotation = parseInt(block.value, 10);
            break;
          case POINT_TOWARDS_RANDOM:
            newState.rotation = Math.floor(Math.random() * 361);
            break;
          case CHANGE_SIZE_TO:
            newState.size = parseInt(block.value, 10);
            break;
          case CHANGE_SIZE_BY:
            newState.size += parseInt(block.value, 10);
            break;
          case HIDE:
            newState.visible = false;
            break;
          case SHOW:
            newState.visible = true;
            break;
          case CHANGE_COLOR:
            setSpriteColor(block.value);
            break;
          case CHANGE_BACKDROP:
            setBackdropValue(String(block.value));
            break;
          case SET_VOLUME:
            setSoundVolume(clampVolume(block.value));
            break;
          case CHANGE_VOLUME_BY:
            setSoundVolume((prevVolume) => clampVolume(prevVolume + parseVolumeDelta(block.value)));
            break;
          case CLEAR_ALL_SOUNDS:
            stopAllSounds(activeAudiosRef);
            break;
          default:
            break;
        }
        return newState;
      });

      waitForVisualAction()
        .then(() => waitForMs(0))
        .then(resolve);
    });
  }, []);
};

export default useExecuteAction;
