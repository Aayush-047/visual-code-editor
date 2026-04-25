import React, { useEffect, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { CONTROLS, EVENTS, MOTION, OPERATORS, SOUND, SPRITE, VARIABLES } from '../constants/BlockTypes';
import {
  MOVE_X, MOVE_Y, TURN_RIGHT, TURN_LEFT, GOTO, GOTO_RANDOM,
  POINT_IN_DIRECTION, POINT_TOWARDS_RANDOM, SAY, THINK,
  SAY_TIMER, THINK_TIMER, CHANGE_SIZE_TO, CHANGE_SIZE_BY,
  CHANGE_COLOR, CHANGE_BACKDROP, HIDE, SHOW, PLAY_SOUND, SET_VOLUME, CHANGE_VOLUME_BY, CLEAR_ALL_SOUNDS, WHEN_KEY_PRESSED, WHEN_SPRITE_CLICKED, WHEN_BACKDROP_SWITCHES_TO, WHEN_LOUDNESS_GREATER_THAN, BROADCAST_MESSAGE_FOR, WAIT_SECONDS, REPEAT_TIMES, FOREVER, IF_THEN, IF_THEN_ELSE, WAIT_UNTIL, REPEAT_UNTIL, OPERATOR_ADD, OPERATOR_SUBTRACT, OPERATOR_MULTIPLY, OPERATOR_DIVIDE, OPERATOR_MODULO, OPERATOR_LESS_THAN, OPERATOR_EQUALS, OPERATOR_GREATER_THAN, OPERATOR_AND, OPERATOR_OR, OPERATOR_NOT, OPERATOR_JOIN, OPERATOR_LETTER_OF, OPERATOR_LENGTH_OF, OPERATOR_CONTAINS, OPERATOR_MATH_FUNCTION, OPERATOR_PICK_RANDOM, VARIABLE_REPORTER, LIST_REPORTER, SET_VARIABLE_TO, CHANGE_VARIABLE_BY, ADD_TO_LIST, DELETE_FROM_LIST, DELETE_ALL_OF_LIST, INSERT_AT_LIST, REPLACE_ITEM_IN_LIST
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
const EVENT_TRIGGER_ACTIONS = [
  WHEN_KEY_PRESSED,
  WHEN_SPRITE_CLICKED,
  WHEN_BACKDROP_SWITCHES_TO,
  WHEN_LOUDNESS_GREATER_THAN,
];
const CONTROL_CONTAINER_ACTIONS = [
  REPEAT_TIMES,
  FOREVER,
  IF_THEN,
  IF_THEN_ELSE,
  REPEAT_UNTIL,
];
const OPERATOR_ACTIONS = [
  OPERATOR_ADD,
  OPERATOR_SUBTRACT,
  OPERATOR_MULTIPLY,
  OPERATOR_DIVIDE,
  OPERATOR_MODULO,
  OPERATOR_LESS_THAN,
  OPERATOR_EQUALS,
  OPERATOR_GREATER_THAN,
  OPERATOR_AND,
  OPERATOR_OR,
  OPERATOR_NOT,
  OPERATOR_JOIN,
  OPERATOR_LETTER_OF,
  OPERATOR_LENGTH_OF,
  OPERATOR_CONTAINS,
  OPERATOR_MATH_FUNCTION,
  OPERATOR_PICK_RANDOM,
];
const OPERATOR_NUMBER_MIN = -1000000;
const OPERATOR_NUMBER_MAX = 1000000;
const MATH_FUNCTION_OPTIONS = ['abs', 'floor', 'ceiling', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'e^', '10^'];

const isOperatorBlockValue = (slotValue) => (
  slotValue && typeof slotValue === 'object' && slotValue.type === OPERATORS
);

const getOperatorInputWidth = (slotValue, compact, minCharsOverride) => {
  const minChars = minCharsOverride ?? (compact ? 7 : 8);
  const maxChars = compact ? 12 : 16;
  const nextChars = String(slotValue ?? '').length || minChars;
  return `${Math.min(maxChars, Math.max(minChars, nextChars + 1))}ch`;
};

const OperatorSlot = ({
  ownerId,
  slotName,
  slotValue,
  onNumberChange,
  onOperatorDrop,
  onNestedBlockChange,
  onNestedBlockRemove,
  availableSounds,
  availableVariables,
  availableLists,
  availableBackdrops,
  isRecordingSound,
  onSoundMenuAction,
  onBackdropMenuAction,
  onNestedDrop,
  onOperatorSlotChange,
  onOperatorSlotDrop,
  onOperatorValidationMessage,
  min,
  max,
  inputType = 'number',
  minCharsOverride,
  compact = false,
}) => {
  const slotRef = useRef(null);
  const slotBlock = isOperatorBlockValue(slotValue) ? slotValue : null;
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'block',
    canDrop: (item) => item.type === OPERATORS && item.id !== ownerId,
    drop: (item, monitor) => {
      if (monitor.didDrop() || !monitor.canDrop()) {
        return undefined;
      }

      onOperatorDrop(ownerId, slotName, item);
      return { dropped: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }) && monitor.canDrop(),
    }),
  }), [ownerId, slotName, onOperatorDrop]);

  drop(slotRef);

  if (slotBlock) {
    return (
      <div
        ref={slotRef}
        className={`min-w-16 min-h-8 rounded-full bg-white/20 p-1 ${isOver ? 'ring-2 ring-white' : ''}`}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <Block
          id={slotBlock.id}
          parentId={ownerId}
          parentSlot={slotName}
          type={slotBlock.type}
          action={slotBlock.action}
          value={slotBlock.value}
          childrenBlocks={slotBlock.children || []}
          onChange={onNestedBlockChange}
          onRemove={onNestedBlockRemove}
          isWorkspaceBlock={true}
          isDraggable={true}
          availableSounds={availableSounds}
          availableVariables={availableVariables}
          availableLists={availableLists}
          availableBackdrops={availableBackdrops}
          isRecordingSound={isRecordingSound}
          onSoundMenuAction={onSoundMenuAction}
          onBackdropMenuAction={onBackdropMenuAction}
          onNestedDrop={onNestedDrop}
          onNestedBlockChange={onNestedBlockChange}
          onNestedBlockRemove={onNestedBlockRemove}
          onOperatorSlotChange={onOperatorSlotChange}
          onOperatorSlotDrop={onOperatorSlotDrop}
          onOperatorValidationMessage={onOperatorValidationMessage}
        />
      </div>
    );
  }

  return (
    <input
      ref={slotRef}
      type={inputType}
      min={inputType === 'number' ? min : undefined}
      max={inputType === 'number' ? max : undefined}
      value={slotValue}
      onChange={(event) => onNumberChange(slotName, event.target.value)}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      className={`${compact ? 'px-1 py-0.5' : 'p-1'} text-black rounded-full ${isOver ? 'ring-2 ring-white' : ''}`}
      style={{
        fontSize: compact ? '0.65rem' : '0.75rem',
        width: getOperatorInputWidth(slotValue, compact, minCharsOverride),
      }}
    />
  );
};

const Block = ({
  id,
  type,
  action,
  value,
  childrenBlocks = [],
  elseChildrenBlocks = [],
  onChange,
  isDraggable = true,
  onRemove,
  index,
  parentId = null,
  moveBlock,
  isWorkspaceBlock = false,
  availableSounds = [],
  availableVariables = [],
  availableLists = [],
  availableBackdrops = BACKDROPS.map((backdrop, index) => ({ ...backdrop, id: String(index) })),
  isRecordingSound = false,
  onSoundMenuAction,
  onBackdropMenuAction,
  onNestedDrop,
  onNestedBlockChange,
  onNestedBlockRemove,
  parentSlot = null,
  onOperatorSlotChange,
  onOperatorSlotDrop,
  onOperatorValidationMessage,
  onDeleteVariableEntity,
}) => {
  const blockRef = useRef(null);
  const nestedDropRef = useRef(null);
  const elseNestedDropRef = useRef(null);
  const [isKeyMenuOpen, setIsKeyMenuOpen] = useState(false);
  const [isBackdropMenuOpen, setIsBackdropMenuOpen] = useState(false);
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false);
  const [isMathMenuOpen, setIsMathMenuOpen] = useState(false);
  const [activeVariableMenu, setActiveVariableMenu] = useState(null);
  const [activeListMenu, setActiveListMenu] = useState(null);
  const selectedKeyOption = KEY_OPTIONS.find((keyOption) => keyOption.value === value) || KEY_OPTIONS[0];
  const selectedBackdropOption = availableBackdrops.find((backdrop) => String(backdrop.id) === String(value)) || availableBackdrops[0];
  const selectedSoundOption = availableSounds.find((sound) => sound.id === value) || availableSounds[0];
  const selectedVariableName = typeof value?.variableName === 'string' ? value.variableName : availableVariables[0] || '';
  const selectedListName = typeof value?.listName === 'string' ? value.listName : availableLists[0] || '';
  const isEventTriggerBlock = EVENT_TRIGGER_ACTIONS.includes(action);
  const isControlContainerBlock = CONTROL_CONTAINER_ACTIONS.includes(action);
  const isOperatorBlock = OPERATOR_ACTIONS.includes(action);

  const [, drop] = useDrop(() => ({
    accept: 'block',
    hover: (item, monitor) => {
      if (!moveBlock || !monitor.isOver({ shallow: true }) || !item.isWorkspaceBlock || item.parentId || item.index === index) {
        return;
      }

      moveBlock(item.index, index);
      item.index = index;
    },
  }), [index, moveBlock]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'block',
    item: { id, type, action, value, childrenBlocks, index, parentId, parentSlot, isWorkspaceBlock },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && !dropResult && onRemove) {
        onRemove(id);
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [id, type, action, value, childrenBlocks, index, parentId, parentSlot, isWorkspaceBlock, onRemove]);

  const [{ isNestedOver }, nestedDrop] = useDrop(() => ({
    accept: 'block',
    canDrop: (item) => (
      (isEventTriggerBlock || isControlContainerBlock)
      && item.id !== id
      && !EVENT_TRIGGER_ACTIONS.includes(item.action)
      && item.type !== OPERATORS
    ),
    drop: (item, monitor) => {
      if (monitor.didDrop() || !monitor.canDrop()) {
        return undefined;
      }

      onNestedDrop?.(id, item, 'children');
      return { dropped: true };
    },
    collect: (monitor) => ({
      isNestedOver: !!monitor.isOver({ shallow: true }) && monitor.canDrop(),
    }),
  }), [id, isControlContainerBlock, isEventTriggerBlock, onNestedDrop]);

  const [{ isElseNestedOver }, elseNestedDrop] = useDrop(() => ({
    accept: 'block',
    canDrop: (item) => (
      action === IF_THEN_ELSE
      && item.id !== id
      && !EVENT_TRIGGER_ACTIONS.includes(item.action)
      && item.type !== OPERATORS
    ),
    drop: (item, monitor) => {
      if (monitor.didDrop() || !monitor.canDrop()) {
        return undefined;
      }

      onNestedDrop?.(id, item, 'elseChildren');
      return { dropped: true };
    },
    collect: (monitor) => ({
      isElseNestedOver: !!monitor.isOver({ shallow: true }) && monitor.canDrop(),
    }),
  }), [action, id, onNestedDrop]);

  if (moveBlock) {
    drop(blockRef);
  }

  if (isDraggable) {
    drag(blockRef);
  }

  if ((isEventTriggerBlock || isControlContainerBlock) && isWorkspaceBlock) {
    nestedDrop(nestedDropRef);
  }

  if (action === IF_THEN_ELSE && isWorkspaceBlock) {
    elseNestedDrop(elseNestedDropRef);
  }

  useEffect(() => {
    const hasOpenMenu = isKeyMenuOpen || isBackdropMenuOpen || isSoundMenuOpen || isMathMenuOpen || activeVariableMenu || activeListMenu;

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
      setIsMathMenuOpen(false);
      setActiveVariableMenu(null);
      setActiveListMenu(null);
    };

    const closeMenusOnEscape = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      setIsKeyMenuOpen(false);
      setIsBackdropMenuOpen(false);
      setIsSoundMenuOpen(false);
      setIsMathMenuOpen(false);
      setActiveVariableMenu(null);
      setActiveListMenu(null);
    };

    document.addEventListener('pointerdown', closeMenusOnOutsideClick);
    document.addEventListener('keydown', closeMenusOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeMenusOnOutsideClick);
      document.removeEventListener('keydown', closeMenusOnEscape);
    };
  }, [isKeyMenuOpen, isBackdropMenuOpen, isSoundMenuOpen, isMathMenuOpen, activeVariableMenu, activeListMenu]);

  const handleInputChange = (e, field) => {
    if (
      action === SET_VARIABLE_TO
      || action === CHANGE_VARIABLE_BY
      || action === ADD_TO_LIST
      || action === DELETE_FROM_LIST
      || action === DELETE_ALL_OF_LIST
      || action === INSERT_AT_LIST
      || action === REPLACE_ITEM_IN_LIST
    ) {
      onChange(id, action, {
        ...value,
        [field]: e.target.value,
      });
      return;
    }

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
        if (action === WAIT_SECONDS) {
          newValue = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value));
        } else if (action === REPEAT_TIMES) {
          newValue = { ...value, [field]: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)) };
        } else {
        newValue = e.target.value;
        }
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

  const handleVariableOptionSelect = (field, variableName) => {
    onChange(id, action, {
      ...value,
      [field]: variableName,
    });
    setActiveVariableMenu(null);
  };

  const handleListOptionSelect = (field, listName) => {
    onChange(id, action, {
      ...value,
      [field]: listName,
    });
    setActiveListMenu(null);
  };

  const handleOperatorSlotNumberChange = (slotName, slotValue) => {
    if (
      (action === OPERATOR_LETTER_OF && slotName === 'source')
      || action === OPERATOR_LENGTH_OF
      || action === OPERATOR_CONTAINS
    ) {
      if (onOperatorSlotChange) {
        onOperatorSlotChange(id, slotName, slotValue);
        return;
      }

      onChange(id, action, {
        ...value,
        [slotName]: slotValue,
      });
      return;
    }

    if (action === OPERATOR_JOIN) {
      if (onOperatorSlotChange) {
        onOperatorSlotChange(id, slotName, slotValue);
        return;
      }

      onChange(id, action, {
        ...value,
        [slotName]: slotValue,
      });
      return;
    }

    let nextSlotError = '';
    let nextSlotValue = slotValue === '' || slotValue === '-'
      ? slotValue
      : parseFloat(slotValue);

    if (typeof nextSlotValue === 'number' && !Number.isNaN(nextSlotValue)) {
      if (nextSlotValue < OPERATOR_NUMBER_MIN || nextSlotValue > OPERATOR_NUMBER_MAX) {
        nextSlotError = `Use a number between ${OPERATOR_NUMBER_MIN} and ${OPERATOR_NUMBER_MAX}.`;
      }
      nextSlotValue = Math.min(OPERATOR_NUMBER_MAX, Math.max(OPERATOR_NUMBER_MIN, nextSlotValue));
    }

    if (action === OPERATOR_PICK_RANDOM && typeof nextSlotValue === 'number' && !Number.isNaN(nextSlotValue)) {
      const otherSlotName = slotName === 'left' ? 'right' : 'left';
      const otherSlotValue = value[otherSlotName];
      const otherNumber = typeof otherSlotValue === 'number' ? otherSlotValue : parseFloat(otherSlotValue);

      if (!Number.isNaN(otherNumber)) {
        if (slotName === 'left') {
          if (nextSlotValue >= otherNumber) {
            nextSlotError = 'Left value must be smaller than right value.';
          }
          nextSlotValue = Math.min(nextSlotValue, otherNumber - 1);
        } else {
          if (nextSlotValue <= otherNumber) {
            nextSlotError = 'Right value must be larger than left value.';
          }
          nextSlotValue = Math.max(nextSlotValue, otherNumber + 1);
        }
      }
    }

    if (nextSlotError) {
      onOperatorValidationMessage?.(nextSlotError);
    }

    if (onOperatorSlotChange) {
      onOperatorSlotChange(id, slotName, nextSlotValue);
      return;
    }

    onChange(id, action, {
      ...value,
      [slotName]: nextSlotValue,
    });
  };

  const handleMathFunctionChange = (nextFunction) => {
    const nextValue = {
      ...value,
      fn: nextFunction,
    };

    if (onOperatorSlotChange) {
      onOperatorSlotChange(id, 'fn', nextFunction);
      return;
    }

    onChange(id, action, nextValue);
  };

  const handleMathFunctionSelect = (nextFunction) => {
    handleMathFunctionChange(nextFunction);
    setIsMathMenuOpen(false);
  };

  const handleOperatorSlotDrop = (ownerId, slotName, item) => {
    onOperatorSlotDrop?.(ownerId, slotName, item);
  };

  const handleDeleteVariableEntity = (entityType, name, event) => {
    event.stopPropagation();
    onDeleteVariableEntity?.(entityType, name);
  };

  const blockContent = (
    <>
      <div className="flex items-center flex-wrap gap-y-1">
        {!isOperatorBlock && type !== VARIABLES && (
          <span className="mr-2" style={{ fontSize: '0.75rem' }}>
            {action === WHEN_BACKDROP_SWITCHES_TO ? 'when' : action === BROADCAST_MESSAGE_FOR ? 'broadcast' : action}
          </span>
        )}
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
        {(action === HIDE || action === SHOW || action === POINT_TOWARDS_RANDOM || action === CLEAR_ALL_SOUNDS || action === WHEN_SPRITE_CLICKED) && (
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
        {type === VARIABLES && action === VARIABLE_REPORTER && (
          <>
            <span className="font-semibold" style={{ fontSize: '0.75rem' }}>{value?.name || 'variable'}</span>
            <button
              type="button"
              onClick={(event) => handleDeleteVariableEntity('variable', value?.name, event)}
              className="ml-2 rounded-full bg-white/20 px-2 text-xs text-white"
            >
              x
            </button>
          </>
        )}
        {type === VARIABLES && action === LIST_REPORTER && (
          <>
            <span className="font-semibold" style={{ fontSize: '0.75rem' }}>{value?.name || 'list'}</span>
            <button
              type="button"
              onClick={(event) => handleDeleteVariableEntity('list', value?.name, event)}
              className="ml-2 rounded-full bg-white/20 px-2 text-xs text-white"
            >
              x
            </button>
          </>
        )}
        {type === VARIABLES && action === SET_VARIABLE_TO && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>set</span>
            <div
              className="relative flex-shrink-0"
              onPointerDown={stopControlDrag}
              onMouseDown={stopControlDrag}
              onTouchStart={stopControlDrag}
            >
              <button
                type="button"
                onClick={() => setActiveVariableMenu((current) => current === 'set-variable' ? null : 'set-variable')}
                className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm mr-1"
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedVariableName || 'variable'}</span>
                <span className="ml-2 text-gray-600">v</span>
              </button>
              {activeVariableMenu === 'set-variable' && (
                <div className="absolute left-0 bottom-full mb-2 w-32 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
                  {availableVariables.map((variableName) => (
                    <button
                      type="button"
                      key={variableName}
                      onClick={() => handleVariableOptionSelect('variableName', variableName)}
                      className={`block w-full text-left px-3 py-2 hover:bg-orange-100 ${
                        variableName === selectedVariableName ? 'bg-orange-200 font-semibold' : ''
                      }`}
                      style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                    >
                      {variableName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>to</span>
            <input
              type="text"
              value={value?.input ?? ''}
              onChange={(event) => handleInputChange(event, 'input')}
              className="w-16 p-1 text-black rounded-full"
              style={{ fontSize: '0.75rem' }}
            />
          </>
        )}
        {type === VARIABLES && action === CHANGE_VARIABLE_BY && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>change</span>
            <div
              className="relative flex-shrink-0"
              onPointerDown={stopControlDrag}
              onMouseDown={stopControlDrag}
              onTouchStart={stopControlDrag}
            >
              <button
                type="button"
                onClick={() => setActiveVariableMenu((current) => current === 'change-variable' ? null : 'change-variable')}
                className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm mr-1"
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedVariableName || 'variable'}</span>
                <span className="ml-2 text-gray-600">v</span>
              </button>
              {activeVariableMenu === 'change-variable' && (
                <div className="absolute left-0 bottom-full mb-2 w-32 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
                  {availableVariables.map((variableName) => (
                    <button
                      type="button"
                      key={variableName}
                      onClick={() => handleVariableOptionSelect('variableName', variableName)}
                      className={`block w-full text-left px-3 py-2 hover:bg-orange-100 ${
                        variableName === selectedVariableName ? 'bg-orange-200 font-semibold' : ''
                      }`}
                      style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                    >
                      {variableName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>by</span>
            <input
              type="number"
              value={value?.amount ?? ''}
              onChange={(event) => handleInputChange(event, 'amount')}
              className="w-14 p-1 text-black rounded-full"
              style={{ fontSize: '0.75rem' }}
            />
          </>
        )}
        {type === VARIABLES && action === ADD_TO_LIST && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>add</span>
            <input
              type="text"
              value={value?.item ?? ''}
              onChange={(event) => handleInputChange(event, 'item')}
              className="w-14 p-1 text-black rounded-full mr-1"
              style={{ fontSize: '0.75rem' }}
            />
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>to list</span>
            <div
              className="relative flex-shrink-0"
              onPointerDown={stopControlDrag}
              onMouseDown={stopControlDrag}
              onTouchStart={stopControlDrag}
            >
              <button
                type="button"
                onClick={() => setActiveListMenu((current) => current === 'add-to-list' ? null : 'add-to-list')}
                className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm"
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedListName || 'list'}</span>
                <span className="ml-2 text-gray-600">v</span>
              </button>
              {activeListMenu === 'add-to-list' && (
                <div className="absolute left-0 bottom-full mb-2 w-32 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
                  {availableLists.map((listName) => (
                    <button
                      type="button"
                      key={listName}
                      onClick={() => handleListOptionSelect('listName', listName)}
                      className={`block w-full text-left px-3 py-2 hover:bg-orange-100 ${
                        listName === selectedListName ? 'bg-orange-200 font-semibold' : ''
                      }`}
                      style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                    >
                      {listName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {type === VARIABLES && action === DELETE_FROM_LIST && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>delete</span>
            <input
              type="number"
              value={value?.index ?? ''}
              onChange={(event) => handleInputChange(event, 'index')}
              className="w-12 p-1 text-black rounded-full mr-1"
              style={{ fontSize: '0.75rem' }}
            />
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>of list</span>
            <div
              className="relative flex-shrink-0"
              onPointerDown={stopControlDrag}
              onMouseDown={stopControlDrag}
              onTouchStart={stopControlDrag}
            >
              <button
                type="button"
                onClick={() => setActiveListMenu((current) => current === 'delete-from-list' ? null : 'delete-from-list')}
                className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm"
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedListName || 'list'}</span>
                <span className="ml-2 text-gray-600">v</span>
              </button>
              {activeListMenu === 'delete-from-list' && (
                <div className="absolute left-0 bottom-full mb-2 w-32 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
                  {availableLists.map((listName) => (
                    <button
                      type="button"
                      key={listName}
                      onClick={() => handleListOptionSelect('listName', listName)}
                      className={`block w-full text-left px-3 py-2 hover:bg-orange-100 ${
                        listName === selectedListName ? 'bg-orange-200 font-semibold' : ''
                      }`}
                      style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                    >
                      {listName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {type === VARIABLES && action === DELETE_ALL_OF_LIST && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>delete all of list</span>
            <div
              className="relative flex-shrink-0"
              onPointerDown={stopControlDrag}
              onMouseDown={stopControlDrag}
              onTouchStart={stopControlDrag}
            >
              <button
                type="button"
                onClick={() => setActiveListMenu((current) => current === 'delete-all-of-list' ? null : 'delete-all-of-list')}
                className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm"
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedListName || 'list'}</span>
                <span className="ml-2 text-gray-600">v</span>
              </button>
              {activeListMenu === 'delete-all-of-list' && (
                <div className="absolute left-0 bottom-full mb-2 w-32 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
                  {availableLists.map((listName) => (
                    <button
                      type="button"
                      key={listName}
                      onClick={() => handleListOptionSelect('listName', listName)}
                      className={`block w-full text-left px-3 py-2 hover:bg-orange-100 ${
                        listName === selectedListName ? 'bg-orange-200 font-semibold' : ''
                      }`}
                      style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                    >
                      {listName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {type === VARIABLES && action === INSERT_AT_LIST && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>insert</span>
            <input
              type="text"
              value={value?.item ?? ''}
              onChange={(event) => handleInputChange(event, 'item')}
              className="w-14 p-1 text-black rounded-full mr-1"
              style={{ fontSize: '0.75rem' }}
            />
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>at</span>
            <input
              type="number"
              value={value?.index ?? ''}
              onChange={(event) => handleInputChange(event, 'index')}
              className="w-12 p-1 text-black rounded-full mr-1"
              style={{ fontSize: '0.75rem' }}
            />
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>of</span>
            <div
              className="relative flex-shrink-0"
              onPointerDown={stopControlDrag}
              onMouseDown={stopControlDrag}
              onTouchStart={stopControlDrag}
            >
              <button
                type="button"
                onClick={() => setActiveListMenu((current) => current === 'insert-at-list' ? null : 'insert-at-list')}
                className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm"
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedListName || 'list'}</span>
                <span className="ml-2 text-gray-600">v</span>
              </button>
              {activeListMenu === 'insert-at-list' && (
                <div className="absolute left-0 bottom-full mb-2 w-32 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
                  {availableLists.map((listName) => (
                    <button
                      type="button"
                      key={listName}
                      onClick={() => handleListOptionSelect('listName', listName)}
                      className={`block w-full text-left px-3 py-2 hover:bg-orange-100 ${
                        listName === selectedListName ? 'bg-orange-200 font-semibold' : ''
                      }`}
                      style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                    >
                      {listName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {type === VARIABLES && action === REPLACE_ITEM_IN_LIST && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>replace item</span>
            <input
              type="number"
              value={value?.index ?? ''}
              onChange={(event) => handleInputChange(event, 'index')}
              className="w-12 p-1 text-black rounded-full mr-1"
              style={{ fontSize: '0.75rem' }}
            />
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>of</span>
            <div
              className="relative flex-shrink-0"
              onPointerDown={stopControlDrag}
              onMouseDown={stopControlDrag}
              onTouchStart={stopControlDrag}
            >
              <button
                type="button"
                onClick={() => setActiveListMenu((current) => current === 'replace-item-in-list' ? null : 'replace-item-in-list')}
                className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm mr-1"
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedListName || 'list'}</span>
                <span className="ml-2 text-gray-600">v</span>
              </button>
              {activeListMenu === 'replace-item-in-list' && (
                <div className="absolute left-0 bottom-full mb-2 w-32 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
                  {availableLists.map((listName) => (
                    <button
                      type="button"
                      key={listName}
                      onClick={() => handleListOptionSelect('listName', listName)}
                      className={`block w-full text-left px-3 py-2 hover:bg-orange-100 ${
                        listName === selectedListName ? 'bg-orange-200 font-semibold' : ''
                      }`}
                      style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                    >
                      {listName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>with</span>
            <input
              type="text"
              value={value?.item ?? ''}
              onChange={(event) => handleInputChange(event, 'item')}
              className="w-14 p-1 text-black rounded-full"
              style={{ fontSize: '0.75rem' }}
            />
          </>
        )}
        {type === CONTROLS && action === WAIT_SECONDS && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>wait</span>
            <input
              type="number"
              min={0}
              value={value}
              onChange={handleInputChange}
              className="w-12 p-1 text-black rounded-full mr-1"
              style={{ fontSize: '0.75rem' }}
            />
            <span className="whitespace-nowrap" style={{ fontSize: '0.75rem' }}>seconds</span>
          </>
        )}
        {type === CONTROLS && action === REPEAT_TIMES && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>repeat</span>
            <input
              type="number"
              min={0}
              value={value?.times ?? ''}
              onChange={(event) => handleInputChange(event, 'times')}
              className="w-12 p-1 text-black rounded-full mr-1"
              style={{ fontSize: '0.75rem' }}
            />
            <span className="whitespace-nowrap" style={{ fontSize: '0.75rem' }}>times</span>
          </>
        )}
        {type === CONTROLS && action === FOREVER && (
          <span className="whitespace-nowrap font-semibold" style={{ fontSize: '0.75rem' }}>forever</span>
        )}
        {type === CONTROLS && action === IF_THEN && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>if</span>
            <OperatorSlot
              ownerId={id}
              slotName="condition"
              slotValue={value?.condition}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableVariables={availableVariables}
              availableLists={availableLists}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
            />
            <span className="ml-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>then</span>
          </>
        )}
        {type === CONTROLS && action === IF_THEN_ELSE && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>if</span>
            <OperatorSlot
              ownerId={id}
              slotName="condition"
              slotValue={value?.condition}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableVariables={availableVariables}
              availableLists={availableLists}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
            />
            <span className="ml-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>then</span>
          </>
        )}
        {type === CONTROLS && action === WAIT_UNTIL && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>wait until</span>
            <OperatorSlot
              ownerId={id}
              slotName="condition"
              slotValue={value?.condition}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableVariables={availableVariables}
              availableLists={availableLists}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
            />
          </>
        )}
        {type === CONTROLS && action === REPEAT_UNTIL && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>repeat until</span>
            <OperatorSlot
              ownerId={id}
              slotName="condition"
              slotValue={value?.condition}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableVariables={availableVariables}
              availableLists={availableLists}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
            />
          </>
        )}
        {isOperatorBlock && action === OPERATOR_PICK_RANDOM && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.65rem' }}>pick random</span>
            <OperatorSlot
              ownerId={id}
              slotName="left"
              slotValue={value.left}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
              compact={true}
            />
            <span className="mx-1 whitespace-nowrap" style={{ fontSize: '0.65rem' }}>to</span>
            <OperatorSlot
              ownerId={id}
              slotName="right"
              slotValue={value.right}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
              compact={true}
            />
          </>
        )}
        {isOperatorBlock && action === OPERATOR_NOT && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>not</span>
            <OperatorSlot
              ownerId={id}
              slotName="operand"
              slotValue={value.operand}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
            />
          </>
        )}
        {isOperatorBlock && action === OPERATOR_JOIN && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>join</span>
            <OperatorSlot
              ownerId={id}
              slotName="left"
              slotValue={value.left}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              inputType="text"
            />
            <OperatorSlot
              ownerId={id}
              slotName="right"
              slotValue={value.right}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              inputType="text"
            />
          </>
        )}
        {isOperatorBlock && action === OPERATOR_LETTER_OF && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>letter</span>
            <OperatorSlot
              ownerId={id}
              slotName="index"
              slotValue={value.index}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
            />
            <span className="mx-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>of</span>
            <OperatorSlot
              ownerId={id}
              slotName="source"
              slotValue={value.source}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              inputType="text"
            />
          </>
        )}
        {isOperatorBlock && action === OPERATOR_LENGTH_OF && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>length of</span>
            <OperatorSlot
              ownerId={id}
              slotName="source"
              slotValue={value.source}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              inputType="text"
            />
          </>
        )}
        {isOperatorBlock && action === OPERATOR_CONTAINS && (
          <>
            <OperatorSlot
              ownerId={id}
              slotName="source"
              slotValue={value.source}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              inputType="text"
            />
            <span className="mx-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>contains</span>
            <OperatorSlot
              ownerId={id}
              slotName="target"
              slotValue={value.target}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              inputType="text"
              minCharsOverride={5}
            />
          </>
        )}
        {isOperatorBlock && action === OPERATOR_MATH_FUNCTION && (
          <>
            <div
              className="relative flex-shrink-0"
              onPointerDown={stopControlDrag}
              onMouseDown={stopControlDrag}
              onTouchStart={stopControlDrag}
            >
              <button
                type="button"
                onClick={() => setIsMathMenuOpen((isOpen) => !isOpen)}
                className="bg-white text-black rounded-full px-2 h-6 w-20 flex items-center justify-between shadow-sm mr-1"
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{value.fn}</span>
                <span className="ml-2 text-gray-600">v</span>
              </button>
              {isMathMenuOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-24 max-h-44 overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-50 transform -translate-y-1">
                  {MATH_FUNCTION_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => handleMathFunctionSelect(option)}
                      className={`block w-full text-left px-3 py-2 hover:bg-green-100 ${
                        option === value.fn ? 'bg-green-200 font-semibold' : ''
                      }`}
                      style={{ fontSize: '0.875rem', lineHeight: '1rem' }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>of</span>
            <OperatorSlot
              ownerId={id}
              slotName="operand"
              slotValue={value.operand}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              onOperatorValidationMessage={onOperatorValidationMessage}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
            />
          </>
        )}
        {isOperatorBlock && action !== OPERATOR_PICK_RANDOM && action !== OPERATOR_NOT && action !== OPERATOR_JOIN && action !== OPERATOR_LETTER_OF && action !== OPERATOR_LENGTH_OF && action !== OPERATOR_CONTAINS && action !== OPERATOR_MATH_FUNCTION && (
          <>
            <OperatorSlot
              ownerId={id}
              slotName="left"
              slotValue={value.left}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
            />
            <span className="mx-1 font-semibold" style={{ fontSize: '0.875rem' }}>{action}</span>
            <OperatorSlot
              ownerId={id}
              slotName="right"
              slotValue={value.right}
              onNumberChange={handleOperatorSlotNumberChange}
              onOperatorDrop={handleOperatorSlotDrop}
              onNestedBlockChange={onNestedBlockChange}
              onNestedBlockRemove={onNestedBlockRemove}
              availableSounds={availableSounds}
              availableBackdrops={availableBackdrops}
              isRecordingSound={isRecordingSound}
              onSoundMenuAction={onSoundMenuAction}
              onBackdropMenuAction={onBackdropMenuAction}
              onNestedDrop={onNestedDrop}
              onOperatorSlotChange={onOperatorSlotChange}
              onOperatorSlotDrop={onOperatorSlotDrop}
              min={OPERATOR_NUMBER_MIN}
              max={OPERATOR_NUMBER_MAX}
            />
          </>
        )}
      </div>
    </>
  );

  if ((isEventTriggerBlock || isControlContainerBlock) && isWorkspaceBlock) {
    return (
      <div
        style={{ maxWidth: 280 }}
        ref={blockRef}
        className={`p-1 m-1 rounded ${isDraggable ? 'cursor-move' : ''} ${
          type === EVENTS ? 'bg-yellow-500' : type === CONTROLS ? 'bg-amber-500' : 'bg-purple-500'
        } text-white ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      >
        {blockContent}
        <div
          ref={nestedDropRef}
          className={`ml-4 mt-2 min-h-16 rounded border-2 border-dashed p-2 ${
            isNestedOver ? 'bg-amber-300 border-white' : 'bg-amber-400 border-amber-200'
          }`}
        >
          {childrenBlocks.length === 0 ? (
            <div className="text-xs text-amber-900 px-1 py-3">Drop blocks here</div>
          ) : (
            childrenBlocks.map((childBlock, childIndex) => (
              <Block
                key={childBlock.id}
                id={childBlock.id}
                index={childIndex}
                parentId={id}
                parentSlot="children"
                type={childBlock.type}
                action={childBlock.action}
                value={childBlock.value}
                childrenBlocks={childBlock.children || []}
                elseChildrenBlocks={childBlock.elseChildren || []}
                onChange={onNestedBlockChange}
                onRemove={onNestedBlockRemove}
                isWorkspaceBlock={true}
                isDraggable={true}
                availableSounds={availableSounds}
                availableVariables={availableVariables}
                availableLists={availableLists}
                availableBackdrops={availableBackdrops}
                isRecordingSound={isRecordingSound}
                onSoundMenuAction={onSoundMenuAction}
                onBackdropMenuAction={onBackdropMenuAction}
                onNestedDrop={onNestedDrop}
                onNestedBlockChange={onNestedBlockChange}
                onNestedBlockRemove={onNestedBlockRemove}
                onOperatorSlotChange={onOperatorSlotChange}
                onOperatorSlotDrop={onOperatorSlotDrop}
                onOperatorValidationMessage={onOperatorValidationMessage}
                onDeleteVariableEntity={onDeleteVariableEntity}
              />
            ))
          )}
        </div>
        {action === IF_THEN_ELSE && (
          <div
            ref={elseNestedDropRef}
            className={`ml-4 mt-2 min-h-16 rounded border-2 border-dashed p-2 ${
              isElseNestedOver ? 'bg-amber-300 border-white' : 'bg-amber-400 border-amber-200'
            }`}
          >
            <div className="mb-1 text-xs font-semibold text-amber-900">else</div>
            {elseChildrenBlocks.length === 0 ? (
              <div className="text-xs text-amber-900 px-1 py-3">Drop blocks here</div>
            ) : (
              elseChildrenBlocks.map((childBlock, childIndex) => (
                <Block
                  key={childBlock.id}
                  id={childBlock.id}
                  index={childIndex}
                  parentId={id}
                  parentSlot="elseChildren"
                  type={childBlock.type}
                  action={childBlock.action}
                  value={childBlock.value}
                  childrenBlocks={childBlock.children || []}
                  elseChildrenBlocks={childBlock.elseChildren || []}
                  onChange={onNestedBlockChange}
                  onRemove={onNestedBlockRemove}
                  isWorkspaceBlock={true}
                  isDraggable={true}
                  availableSounds={availableSounds}
                  availableVariables={availableVariables}
                  availableLists={availableLists}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={onSoundMenuAction}
                  onBackdropMenuAction={onBackdropMenuAction}
                  onNestedDrop={onNestedDrop}
                  onNestedBlockChange={onNestedBlockChange}
                  onNestedBlockRemove={onNestedBlockRemove}
                  onOperatorSlotChange={onOperatorSlotChange}
                  onOperatorSlotDrop={onOperatorSlotDrop}
                  onOperatorValidationMessage={onOperatorValidationMessage}
                  onDeleteVariableEntity={onDeleteVariableEntity}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ maxWidth: 220 }}
      ref={blockRef}
      className={`p-1 m-1 rounded ${isDraggable ? 'cursor-move' : ''} flex items-center ${action === BROADCAST_MESSAGE_FOR ? 'flex-wrap gap-y-1' : ''} ${
        type === MOTION ? 'bg-blue-500' : type === SOUND ? 'bg-pink-500' : type === SPRITE ? 'bg-orange-500' : type === EVENTS ? 'bg-yellow-500' : type === CONTROLS ? 'bg-amber-500' : type === OPERATORS ? 'bg-green-500' : type === VARIABLES ? 'bg-orange-600' : 'bg-purple-500'
      } text-white ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {blockContent}
    </div>
  );
};

export default Block;
