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

const parseDuration = (value) => {
  const duration = parseFloat(value);
  return Number.isNaN(duration) ? 2 : Math.max(0, duration);
};

const useExecuteAction = (spriteRef) => {
  return useCallback(async (block, sounds, soundVolume, activeAudiosRef, setSpriteState, setSpeechBubble, setSpriteColor, setBackdropValue, setSoundVolume, setBroadcastMessage) => { 
    const sprite = spriteRef.current;
    if (!sprite) return;

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
          case SAY:
          case THINK:
            setSpeechBubble({ message: block.value || (block.action === SAY ? 'Hello!' : 'Hmm...'), isThinking: block.action === THINK });
            setTimeout(() => {
              setSpeechBubble({ message: '', isThinking: false });
              resolve();
            }, 2000);
            return prevState;
          case SAY_TIMER:
          case THINK_TIMER:
            setSpeechBubble({ message: block.value.message || (block.action === SAY_TIMER ? 'Hello!' : 'Hmm...'), isThinking: block.action === THINK_TIMER });
            setTimeout(() => {
              setSpeechBubble({ message: '', isThinking: false });
              resolve();
            }, block.value.duration * 1000);
            return prevState;
          case CHANGE_SIZE_TO:
            newState.size = parseInt(block.value, 10);
            break;
          case CHANGE_SIZE_BY:
            newState.size += parseInt(block.value, 10);
            break;
          case HIDE:
            sprite.style.opacity = 0;
            break;
          case SHOW:
            sprite.style.opacity = 1;
            break;
          case CHANGE_COLOR:
            setSpriteColor(block.value);
            break;
          case CHANGE_BACKDROP:
            setBackdropValue(String(block.value));
            break;
          case PLAY_SOUND: {
            const sound = sounds.find(({ id }) => id === block.value);
            if (sound?.url) {
              const audio = new Audio(sound.url);
              audio.volume = clampVolume(soundVolume) / 100;
              activeAudiosRef.current.push(audio);

              const removeAudio = () => {
                activeAudiosRef.current = activeAudiosRef.current.filter((activeAudio) => activeAudio !== audio);
              };

              audio.addEventListener('ended', removeAudio, { once: true });
              void audio.play().catch(removeAudio);
            }
            break;
          }
          case SET_VOLUME:
            setSoundVolume(clampVolume(block.value));
            break;
          case CHANGE_VOLUME_BY:
            setSoundVolume((prevVolume) => clampVolume(prevVolume + parseVolumeDelta(block.value)));
            break;
          case CLEAR_ALL_SOUNDS:
            stopAllSounds(activeAudiosRef);
            break;
          case BROADCAST_MESSAGE_FOR:
            setBroadcastMessage?.({
              message: block.value?.message || 'Hello!',
              color: block.value?.color || '#111111',
            });
            setTimeout(() => {
              setBroadcastMessage?.({ message: '', color: '#111111' });
              resolve();
            }, parseDuration(block.value?.duration) * 1000);
            return prevState;
          default:
            break;
        }

        sprite.style.transform = `translate(${newState.x}px, ${newState.y}px) rotate(${newState.rotation + 90}deg) scale(${newState.size / 100})`;
        return newState;
      });
      resolve();
        });
  }, [spriteRef]);
};

export default useExecuteAction;
