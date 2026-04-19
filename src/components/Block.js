import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { MOTION, SOUND, SPRITE } from '../constants/BlockTypes';
import {
  MOVE_X, MOVE_Y, TURN_RIGHT, TURN_LEFT, GOTO, GOTO_RANDOM,
  POINT_IN_DIRECTION, POINT_TOWARDS_RANDOM, SAY, THINK,
  SAY_TIMER, THINK_TIMER, CHANGE_SIZE_TO, CHANGE_SIZE_BY,
  CHANGE_COLOR, CHANGE_BACKDROP, HIDE, SHOW, PLAY_SOUND, SET_VOLUME, CHANGE_VOLUME_BY, CLEAR_ALL_SOUNDS
} from '../constants/ActionTypes';
import { BACKDROPS } from '../data/BackDrops';

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
    } else {
      if (action === SET_VOLUME) {
        newValue = e.target.value === ''
          ? ''
          : Math.min(100, Math.max(0, parseInt(e.target.value, 10)));
      } else if (action === CHANGE_VOLUME_BY) {
        newValue = e.target.value === '' || e.target.value === '-'
          ? e.target.value
          : parseInt(e.target.value, 10);
      } else {
        newValue = e.target.value;
      }
    }
    onChange(id, action, newValue);
  };

  return (
    <div
      style={{maxWidth: 220}}
      ref={blockRef}
      className={`p-1 m-1 rounded ${isDraggable ? 'cursor-move' : ''} flex items-center ${
        type === MOTION ? 'bg-blue-500' : type === SOUND ? 'bg-pink-500' : type === SPRITE ? 'bg-orange-500' : 'bg-purple-500'
      } text-white ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <span className="mr-2" style={{ fontSize: '0.75rem' }}>{action}</span>
      {(action === MOVE_X || action === MOVE_Y || action === TURN_RIGHT || action === TURN_LEFT || action === POINT_IN_DIRECTION || action === CHANGE_SIZE_TO || action === CHANGE_SIZE_BY || action === SET_VOLUME || action === CHANGE_VOLUME_BY) && (
        <input
          type="number"
          min={action === SET_VOLUME ? 0 : undefined}
          max={action === SET_VOLUME ? 100 : undefined}
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
      {action === CHANGE_BACKDROP && (
        <select
          value={String(value)}
          onChange={handleInputChange}
          className="bg-white text-black p-1 rounded-full"
          style={{ fontSize: '0.75rem' }}
        >
          {availableBackdrops.map((backdrop) => (
            <option key={backdrop.id} value={backdrop.id}>
              {backdrop.name}
            </option>
          ))}
          <option value={UPLOAD_BACKDROP_OPTION}>Upload image</option>
        </select>
      )}
      {action === PLAY_SOUND && (
        <select
          value={value}
          onChange={handleInputChange}
          className="bg-white text-black p-1 rounded-full"
          style={{ fontSize: '0.75rem' }}
        >
          {availableSounds.map((sound) => (
            <option key={sound.id} value={sound.id}>
              {sound.name}
            </option>
          ))}
          <option value={RECORD_SOUND_OPTION}>Record new sound</option>
        </select>
      )}
      
    </div>
  );
};

export default Block;
