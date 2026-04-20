import React, { useEffect, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { EVENTS, MOTION, SOUND, SPRITE } from '../constants/BlockTypes';
import {
  MOVE_X, MOVE_Y, TURN_RIGHT, TURN_LEFT, GOTO, GOTO_RANDOM,
  POINT_IN_DIRECTION, POINT_TOWARDS_RANDOM, SAY, THINK,
  SAY_TIMER, THINK_TIMER, CHANGE_SIZE_TO, CHANGE_SIZE_BY,
  CHANGE_COLOR, CHANGE_BACKDROP, HIDE, SHOW, PLAY_SOUND, SET_VOLUME, CHANGE_VOLUME_BY, CLEAR_ALL_SOUNDS, WHEN_KEY_PRESSED, WHEN_BACKDROP_SWITCHES_TO, WHEN_LOUDNESS_GREATER_THAN, BROADCAST_MESSAGE_FOR
} from '../constants/ActionTypes';
import { BACKDROPS } from '../data/BackDrops';

const KEY_OPTIONS = [
  { value: 'Space', label: 'space' },
  { value: 'ArrowUp', label: 'up arrow' },
  { value: 'ArrowDown', label: 'down arrow' },
  { value: 'ArrowLeft', label: 'left arrow' },
  { value: 'ArrowRight', label: 'right arrow' },
  { value: 'Enter', label: 'enter' },
  { value: 'Escape', label: 'escape' },
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
    value: `Key${letter}`,
    label: letter.toLowerCase(),
  })),
  ...'0123456789'.split('').map((number) => ({
    value: `Digit${number}`,
    label: number,
  })),
];

const RECORD_SOUND_OPTION = '__record_sound__';
const UPLOAD_BACKDROP_OPTION = '__upload_backdrop__';
const Block = ({
  id,
  type,
  action,
  value,
  onChange,
  isDraggable = true,
  onRemove,
  index,
  moveBlock,
  isWorkspaceBlock = false,
  availableSounds = [],
  availableBackdrops = BACKDROPS.map((backdrop, index) => ({ ...backdrop, id: String(index) })),
  isRecordingSound = false,
  onSoundMenuAction,
  onBackdropMenuAction,
}) => {
  const blockRef = useRef(null);
  const [isKeyMenuOpen, setIsKeyMenuOpen] = useState(false);
  const [isBackdropMenuOpen, setIsBackdropMenuOpen] = useState(false);
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false);
  const selectedKeyOption = KEY_OPTIONS.find((keyOption) => keyOption.value === value) || KEY_OPTIONS[0];
  const selectedBackdropOption = availableBackdrops.find((backdrop) => String(backdrop.id) === String(value)) || availableBackdrops[0];
  const selectedSoundOption = availableSounds.find((sound) => sound.id === value) || availableSounds[0];

  const [, drop] = useDrop(() => ({
    accept: 'block',
    hover: (item) => {
      if (!moveBlock || !item.isWorkspaceBlock || item.index === index) {
        return;
      }

      moveBlock(item.index, index);
      item.index = index;
    },
  }), [index, moveBlock]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'block',
    item: { id, type, action, value, index, isWorkspaceBlock },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && !dropResult && onRemove) {
        onRemove(id);
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [id, type, action, value, index, isWorkspaceBlock, onRemove]);

  if (moveBlock) {
    drop(blockRef);
  }

  if (isDraggable) {
    drag(blockRef);
  }

  useEffect(() => {
    const hasOpenMenu = isKeyMenuOpen || isBackdropMenuOpen || isSoundMenuOpen;

    if (!hasOpenMenu) {
      return undefined;
    }

    const closeMenusOnOutsideClick = (event) => {
      if (blockRef.current?.contains(event.target)) {
        return;
      }

      setIsKeyMenuOpen(false);
      setIsBackdropMenuOpen(false);
      setIsSoundMenuOpen(false);
    };

    const closeMenusOnEscape = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      setIsKeyMenuOpen(false);
      setIsBackdropMenuOpen(false);
      setIsSoundMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeMenusOnOutsideClick);
    document.addEventListener('keydown', closeMenusOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeMenusOnOutsideClick);
      document.removeEventListener('keydown', closeMenusOnEscape);
    };
  }, [isKeyMenuOpen, isBackdropMenuOpen, isSoundMenuOpen]);

  const handleInputChange = (e, field) => {
    if (action === PLAY_SOUND) {
      if (e.target.value === RECORD_SOUND_OPTION) {
        onSoundMenuAction?.(e.target.value);
        return;
      }
    }

    if (action === CHANGE_BACKDROP && e.target.value === UPLOAD_BACKDROP_OPTION) {
      onBackdropMenuAction?.(id, action, onChange);
      return;
    }

    let newValue;
    if (action === GOTO) {
      newValue = value.map((v, i) => i === field ? parseInt(e.target.value, 10) : v);
    } else if (action === SAY_TIMER || action === THINK_TIMER) {
      newValue = { ...value, [field]: field === 'duration' ? parseInt(e.target.value, 10) : e.target.value };
    } else if (action === BROADCAST_MESSAGE_FOR) {
      newValue = {
        ...value,
        [field]: field === 'duration'
          ? (e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
          : e.target.value,
      };
    } else {
      if (action === SET_VOLUME) {
        newValue = e.target.value === ''
          ? ''
          : Math.min(100, Math.max(0, parseInt(e.target.value, 10)));
      } else if (action === CHANGE_VOLUME_BY) {
        newValue = e.target.value === '' || e.target.value === '-'
          ? e.target.value
          : parseInt(e.target.value, 10);
      } else if (action === WHEN_LOUDNESS_GREATER_THAN) {
        newValue = e.target.value === ''
          ? ''
          : Math.min(100, Math.max(1, parseInt(e.target.value, 10)));
      } else {
        newValue = e.target.value;
      }
    }
    onChange(id, action, newValue);
  };

  const stopControlDrag = (event) => {
    event.stopPropagation();
  };

  const handleKeyOptionSelect = (keyValue) => {
    onChange(id, action, keyValue);
    setIsKeyMenuOpen(false);
  };

  const handleBackdropOptionSelect = (backdropValue) => {
    if (backdropValue === UPLOAD_BACKDROP_OPTION && action === CHANGE_BACKDROP) {
      onBackdropMenuAction?.(id, action, onChange);
    } else {
      onChange(id, action, backdropValue);
    }

    setIsBackdropMenuOpen(false);
  };

  const handleSoundOptionSelect = (soundValue) => {
    if (soundValue === RECORD_SOUND_OPTION) {
      onSoundMenuAction?.(soundValue);
    } else {
      onChange(id, action, soundValue);
    }

    setIsSoundMenuOpen(false);
  };

  return (
    <div
      style={{ maxWidth: 220 }}
      ref={blockRef}
      className={`p-1 m-1 rounded ${isDraggable ? 'cursor-move' : ''} flex items-center ${action === BROADCAST_MESSAGE_FOR ? 'flex-wrap gap-y-1' : ''} ${
        type === MOTION ? 'bg-blue-500' : type === SOUND ? 'bg-pink-500' : type === SPRITE ? 'bg-orange-500' : type === EVENTS ? 'bg-yellow-500' : 'bg-purple-500'
      } text-white ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <span className="mr-2" style={{ fontSize: '0.75rem' }}>
        {action === WHEN_BACKDROP_SWITCHES_TO ? 'when' : action === BROADCAST_MESSAGE_FOR ? 'broadcast' : action}
      </span>
      {(action === MOVE_X || action === MOVE_Y || action === TURN_RIGHT || action === TURN_LEFT || action === POINT_IN_DIRECTION || action === CHANGE_SIZE_TO || action === CHANGE_SIZE_BY || action === SET_VOLUME || action === CHANGE_VOLUME_BY || action === WHEN_LOUDNESS_GREATER_THAN) && (
        <input
          type="number"
          min={action === SET_VOLUME ? 0 : action === WHEN_LOUDNESS_GREATER_THAN ? 1 : undefined}
          max={(action === SET_VOLUME || action === WHEN_LOUDNESS_GREATER_THAN) ? 100 : undefined}
          value={value}
          onChange={handleInputChange}
          className="w-12 p-1 text-black rounded-full"
          style={{ fontSize: '0.75rem' }}
        />
      )}
      {action === SET_VOLUME && (
        <span className="ml-1" style={{ fontSize: '0.75rem' }}>%</span>
      )}
      {action === CHANGE_VOLUME_BY && (
        <span className="ml-1" style={{ fontSize: '0.75rem' }}>%</span>
      )}
      {action === WHEN_LOUDNESS_GREATER_THAN && (
        <span className="ml-1" style={{ fontSize: '0.75rem' }}>%</span>
      )}
      {action === BROADCAST_MESSAGE_FOR && (
        <>
          <input
            type="text"
            value={value.message}
            onChange={(e) => handleInputChange(e, 'message')}
            className="w-16 p-1 text-black rounded-full mr-1"
            placeholder="message"
            style={{ fontSize: '0.75rem' }}
          />
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>for</span>
          <input
            type="number"
            min={0}
            value={value.duration}
            onChange={(e) => handleInputChange(e, 'duration')}
            className="w-12 p-1 text-black rounded-full"
            placeholder="sec"
            style={{ fontSize: '0.75rem' }}
          />
          <span className="mx-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>sec</span>
          <input
            type="color"
            value={value.color}
            onChange={(e) => handleInputChange(e, 'color')}
            className="w-6 h-6 p-0 border-0 flex-shrink-0"
            style={{ fontSize: '0.75rem' }}
          />
        </>
      )}
      {action === WHEN_KEY_PRESSED && (
        <>
          <div
            className="relative flex-shrink-0"
            onPointerDown={stopControlDrag}
            onMouseDown={stopControlDrag}
            onTouchStart={stopControlDrag}
          >
            <button
              type="button"
              onClick={() => setIsKeyMenuOpen((isOpen) => !isOpen)}
              className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm"
              style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
            >
              <span className="truncate">{selectedKeyOption.label}</span>
              <span className="ml-2 text-gray-600">v</span>
            </button>
            {isKeyMenuOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-36 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
                {KEY_OPTIONS.map((keyOption) => (
                  <button
                    type="button"
                    key={keyOption.value}
                    onClick={() => handleKeyOptionSelect(keyOption.value)}
                    className={`block w-full text-left px-3 py-2 hover:bg-yellow-100 ${
                      keyOption.value === value ? 'bg-yellow-200 font-semibold' : ''
                    }`}
                    style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                  >
                    {keyOption.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="ml-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>key pressed</span>
        </>
      )}
      {action === GOTO_RANDOM && (
        <span style={{ fontSize: '0.75rem' }}></span>
      )}
      {action === GOTO && (
        <>
          <input
            type="number"
            value={value[0]}
            onChange={(e) => handleInputChange(e, 0)}
            className="w-12 p-1 text-black rounded-full mr-1"
            placeholder="X"
            style={{ fontSize: '0.75rem' }}
          />
          <input
            type="number"
            value={value[1]}
            onChange={(e) => handleInputChange(e, 1)}
            className="w-12 p-1 text-black rounded-full"
            placeholder="Y"
            style={{ fontSize: '0.75rem' }}
          />
        </>
      )}
      {(action === SAY || action === THINK) && (
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          className="w-16 p-1 text-black rounded-full"
          placeholder="message"
          style={{ fontSize: '0.75rem' }}
        />
      )}
      {(action === SAY_TIMER || action === THINK_TIMER) && (
        <>
          <input
            type="text"
            value={value.message}
            onChange={(e) => handleInputChange(e, 'message')}
            className="w-16 p-1 text-black rounded-full mr-1"
            placeholder="message"
            style={{ fontSize: '0.75rem' }}
          />
          <input
            type="number"
            value={value.duration}
            onChange={(e) => handleInputChange(e, 'duration')}
            className="w-12 p-1 text-black rounded-full"
            placeholder="Seconds"
            style={{ fontSize: '0.75rem' }}
          />
        </>
      )}
      {action === CHANGE_COLOR && (
        <input
          type="color"
          value={value}
          onChange={handleInputChange}
          className="w-6 h-6 p-0 border-0"
          style={{ fontSize: '0.75rem' }}
        />
      )}
      {(action === HIDE || action === SHOW || action === POINT_TOWARDS_RANDOM || action === CLEAR_ALL_SOUNDS) && (
        <span style={{ fontSize: '0.75rem' }}></span>
      )}
      {(action === CHANGE_BACKDROP || action === WHEN_BACKDROP_SWITCHES_TO) && (
        <div
          className="relative flex-shrink-0"
          onPointerDown={stopControlDrag}
          onMouseDown={stopControlDrag}
          onTouchStart={stopControlDrag}
        >
          <button
            type="button"
            onClick={() => setIsBackdropMenuOpen((isOpen) => !isOpen)}
            className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm"
            style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
          >
            <span className="truncate">{selectedBackdropOption?.name || 'Backdrop'}</span>
            <span className="ml-2 text-gray-600">v</span>
          </button>
          {isBackdropMenuOpen && (
            <div className="absolute left-0 bottom-full mb-2 w-44 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
              {availableBackdrops.map((backdrop) => (
                <button
                  type="button"
                  key={backdrop.id}
                  onClick={() => handleBackdropOptionSelect(backdrop.id)}
                  className={`block w-full text-left px-3 py-2 hover:bg-purple-100 ${
                    String(backdrop.id) === String(value) ? 'bg-purple-200 font-semibold' : ''
                  }`}
                  style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                >
                  {backdrop.name}
                </button>
              ))}
              {action === CHANGE_BACKDROP && (
                <button
                  type="button"
                  onClick={() => handleBackdropOptionSelect(UPLOAD_BACKDROP_OPTION)}
                  className="block w-full text-left px-3 py-2 hover:bg-purple-100 border-t border-gray-200"
                  style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                >
                  Upload image
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {action === WHEN_BACKDROP_SWITCHES_TO && (
        <span className="ml-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>switches to</span>
      )}
      {action === PLAY_SOUND && (
        <div
          className="relative flex-shrink-0"
          onPointerDown={stopControlDrag}
          onMouseDown={stopControlDrag}
          onTouchStart={stopControlDrag}
        >
          <button
            type="button"
            onClick={() => setIsSoundMenuOpen((isOpen) => !isOpen)}
            className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm"
            style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
          >
            <span className="truncate">{selectedSoundOption?.name || 'Sound'}</span>
            <span className="ml-2 text-gray-600">v</span>
          </button>
          {isSoundMenuOpen && (
            <div className="absolute left-0 bottom-full mb-2 w-44 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
              {availableSounds.map((sound) => (
                <button
                  type="button"
                  key={sound.id}
                  onClick={() => handleSoundOptionSelect(sound.id)}
                  className={`block w-full text-left px-3 py-2 hover:bg-pink-100 ${
                    sound.id === value ? 'bg-pink-200 font-semibold' : ''
                  }`}
                  style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                >
                  {sound.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleSoundOptionSelect(RECORD_SOUND_OPTION)}
                className="block w-full text-left px-3 py-2 hover:bg-pink-100 border-t border-gray-200"
                style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
              >
                Record new sound
              </button>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
};

export default Block;
