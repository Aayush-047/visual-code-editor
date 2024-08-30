import React from 'react';
import { useDrag } from 'react-dnd';
import { MOTION, LOOKS } from '../constants/BlockTypes';
import {
  MOVE_X, MOVE_Y, TURN_RIGHT, TURN_LEFT, GOTO, GOTO_RANDOM,
  POINT_IN_DIRECTION, POINT_TOWARDS_RANDOM, SAY, THINK,
  SAY_TIMER, THINK_TIMER, CHANGE_SIZE_TO, CHANGE_SIZE_BY,
  CHANGE_COLOR, CHANGE_BACKDROP, HIDE, SHOW
} from '../constants/ActionTypes';
import { BACKDROPS } from '../data/BackDrops';

const Block = ({ id, type, action, value, onChange, isDraggable = true, onRemove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'block',
    item: { id, type, action, value },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && !dropResult && onRemove) {
        onRemove(id);
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [id, type, action, value, onRemove]);

  const handleInputChange = (e, field) => {
    let newValue;
    if (action === GOTO) {
      newValue = value.map((v, i) => i === field ? parseInt(e.target.value, 10) : v);
    } else if (action === SAY_TIMER || action === THINK_TIMER) {
      newValue = { ...value, [field]: field === 'duration' ? parseInt(e.target.value, 10) : e.target.value };
    } else {
      newValue = e.target.value;
    }
    onChange(id, action, newValue);
  };

  return (
    <div
      style={{maxWidth: 220}}
      ref={isDraggable ? drag : null}
      className={`p-1 m-1 rounded ${isDraggable ? 'cursor-move' : ''} flex items-center ${
        type === MOTION ? 'bg-blue-500' : 'bg-purple-500'
      } text-white ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <span className="mr-2" style={{ fontSize: '0.75rem' }}>{action}</span>
      {(action === MOVE_X || action === MOVE_Y || action === TURN_RIGHT || action === TURN_LEFT || action === POINT_IN_DIRECTION || action === CHANGE_SIZE_TO || action === CHANGE_SIZE_BY) && (
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          className="w-12 p-1 text-black rounded-full"
          style={{ fontSize: '0.75rem' }}
        />
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
      {(action === HIDE || action === SHOW || action === POINT_TOWARDS_RANDOM) && (
        <span style={{ fontSize: '0.75rem' }}></span>
      )}
      {action === CHANGE_BACKDROP && (
        <select
          value={value}
          onChange={handleInputChange}
          className="bg-white text-black p-1 rounded-full"
          style={{ fontSize: '0.75rem' }}
        >
          {BACKDROPS.map((backdrop, index) => (
            <option key={index} value={index}>
              {backdrop.name}
            </option>
          ))}
        </select>
      )}
      
    </div>
  );
};

export default Block;