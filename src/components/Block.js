import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDrag, useDrop } from 'react-dnd';
import { CONTROLS, EVENTS, MOTION, OPERATORS, SOUND, SPRITE, VARIABLES } from '../constants/BlockTypes';
import Tooltip from './Tooltip';
import {
  MOVE_X, MOVE_Y, TURN_RIGHT, TURN_LEFT, GOTO, GOTO_RANDOM,
  POINT_IN_DIRECTION, POINT_TOWARDS_RANDOM, SAY, THINK,
  SAY_TIMER, THINK_TIMER, CHANGE_SIZE_TO, CHANGE_SIZE_BY,
  CHANGE_COLOR, CHANGE_BACKDROP, HIDE, SHOW, PLAY_SOUND, SET_VOLUME, CHANGE_VOLUME_BY, CLEAR_ALL_SOUNDS, WHEN_KEY_PRESSED, WHEN_SPRITE_CLICKED, WHEN_BACKDROP_SWITCHES_TO, WHEN_LOUDNESS_GREATER_THAN, WHEN_I_RECEIVE, BROADCAST_MESSAGE_FOR, WAIT_SECONDS, REPEAT_TIMES, FOREVER, IF_THEN, IF_THEN_ELSE, WAIT_UNTIL, REPEAT_UNTIL, OPERATOR_ADD, OPERATOR_SUBTRACT, OPERATOR_MULTIPLY, OPERATOR_DIVIDE, OPERATOR_MODULO, OPERATOR_LESS_THAN, OPERATOR_EQUALS, OPERATOR_GREATER_THAN, OPERATOR_AND, OPERATOR_OR, OPERATOR_NOT, OPERATOR_JOIN, OPERATOR_LETTER_OF, OPERATOR_LENGTH_OF, OPERATOR_CONTAINS, OPERATOR_MATH_FUNCTION, OPERATOR_PICK_RANDOM, VARIABLE_REPORTER, LIST_REPORTER, SET_VARIABLE_TO, CHANGE_VARIABLE_BY, ADD_TO_LIST, DELETE_FROM_LIST, DELETE_ALL_OF_LIST, INSERT_AT_LIST, REPLACE_ITEM_IN_LIST
} from '../constants/ActionTypes';

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
  WHEN_I_RECEIVE,
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
const DROPDOWN_MENU_MAX_HEIGHT = 176;
const INPUT_BASE_CLASSNAME = 'themed-input-pill rounded-full border border-transparent px-2 py-1 text-black outline-none transition';
const WORKSPACE_INPUT_CLASSNAME = 'focus:border-blue-500 focus:ring-2 focus:ring-blue-200';
const PALETTE_INPUT_CLASSNAME = 'focus:border-slate-300';
const DROPDOWN_PILL_CLASSNAME = 'dropdown-pill flex items-center justify-between gap-2 rounded-full bg-white px-2 text-black shadow-sm';
const EVENT_TOOLTIPS = {
  [WHEN_KEY_PRESSED]: 'Runs when you press this keyboard key',
  [WHEN_SPRITE_CLICKED]: 'Runs when you click the sprite in the preview',
  [WHEN_BACKDROP_SWITCHES_TO]: 'Runs when the stage changes to this backdrop',
  [WHEN_LOUDNESS_GREATER_THAN]: 'Runs when your microphone hears a loud sound',
  [WHEN_I_RECEIVE]: 'Runs when another block broadcasts this message',
};
const SOUND_ICONS = {
  [PLAY_SOUND]: '♪',
  [SET_VOLUME]: '▤',
  [CHANGE_VOLUME_BY]: '±',
  [CLEAR_ALL_SOUNDS]: '✕',
};

const isOperatorBlockValue = (slotValue) => (
  slotValue && typeof slotValue === 'object' && slotValue.type === OPERATORS
);

const getOperatorInputWidth = (slotValue, compact, minCharsOverride) => {
  const minChars = minCharsOverride ?? (compact ? 7 : 8);
  const maxChars = compact ? 12 : 16;
  const nextChars = String(slotValue ?? '').length || minChars;
  return `${Math.min(maxChars, Math.max(minChars, nextChars + 1))}ch`;
};

const BlockDropdownMenu = ({ isOpen, triggerRef, width = 128, children }) => {
  const [menuStyle, setMenuStyle] = useState(null);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setMenuStyle(null);
      return undefined;
    }

    const updatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuWidth = Math.max(width, triggerRect.width);
      const viewportPadding = 8;
      const gap = 8;
      const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
      const spaceAbove = triggerRect.top - viewportPadding;
      const opensBelow = spaceBelow >= Math.min(DROPDOWN_MENU_MAX_HEIGHT, spaceAbove);
      const left = Math.min(
        window.innerWidth - menuWidth - viewportPadding,
        Math.max(viewportPadding, triggerRect.left)
      );
      const top = opensBelow
        ? triggerRect.bottom + gap
        : Math.max(viewportPadding, triggerRect.top - DROPDOWN_MENU_MAX_HEIGHT - gap);

      setMenuStyle({
        left,
        top,
        width: menuWidth,
        maxHeight: Math.max(80, Math.min(DROPDOWN_MENU_MAX_HEIGHT, opensBelow ? spaceBelow - gap : spaceAbove - gap)),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef, width]);

  if (!isOpen || !menuStyle) {
    return null;
  }

  return createPortal(
    <div
      data-block-dropdown-menu="true"
      className="fixed overflow-y-auto bg-white text-black rounded shadow-2xl border border-gray-200 z-[9999]"
      style={menuStyle}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
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
  selectedBlockId = '',
  onSelect,
  onRequestRemove,
  removingBlockIds = [],
  recentlyAddedBlockIds = [],
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
          selectedBlockId={selectedBlockId}
          onSelect={onSelect}
          onRequestRemove={onRequestRemove}
          removingBlockIds={removingBlockIds}
          recentlyAddedBlockIds={recentlyAddedBlockIds}
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
  availableBackdrops = [],
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
  isSelected = false,
  onSelect,
  onRequestRemove,
  isDeleting = false,
  isNewlyPlaced = false,
  showSnapIndicators = false,
  selectedBlockId = '',
  removingBlockIds = [],
  recentlyAddedBlockIds = [],
}) => {
  const blockRef = useRef(null);
  const nestedDropRef = useRef(null);
  const elseNestedDropRef = useRef(null);
  const keyMenuTriggerRef = useRef(null);
  const backdropMenuTriggerRef = useRef(null);
  const soundMenuTriggerRef = useRef(null);
  const mathMenuTriggerRef = useRef(null);
  const variableMenuTriggerRefs = useRef({});
  const listMenuTriggerRefs = useRef({});
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

  const [{ isTopLevelOver }, drop] = useDrop(() => ({
    accept: 'block',
    hover: (item, monitor) => {
      if (!moveBlock || !monitor.isOver({ shallow: true }) || !item.isWorkspaceBlock || item.parentId || item.index === index) {
        return;
      }

      moveBlock(item.index, index);
      item.index = index;
    },
    collect: (monitor) => ({
      isTopLevelOver: !!monitor.isOver({ shallow: true }) && monitor.canDrop(),
    }),
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

  const attachBlockRef = useCallback((node) => {
    blockRef.current = node;

    if (!node) {
      return;
    }

    if (moveBlock) {
      drop(node);
    }

    if (isDraggable) {
      drag(node);
    }
  }, [drag, drop, isDraggable, moveBlock]);

  const attachNestedDropRef = useCallback((node) => {
    nestedDropRef.current = node;

    if (!node) {
      return;
    }

    if ((isEventTriggerBlock || isControlContainerBlock) && isWorkspaceBlock) {
      nestedDrop(node);
    }
  }, [isControlContainerBlock, isEventTriggerBlock, isWorkspaceBlock, nestedDrop]);

  const attachElseNestedDropRef = useCallback((node) => {
    elseNestedDropRef.current = node;

    if (!node) {
      return;
    }

    if (action === IF_THEN_ELSE && isWorkspaceBlock) {
      elseNestedDrop(node);
    }
  }, [action, elseNestedDrop, isWorkspaceBlock]);

  useEffect(() => {
    const hasOpenMenu = isKeyMenuOpen || isBackdropMenuOpen || isSoundMenuOpen || isMathMenuOpen || activeVariableMenu || activeListMenu;

    if (!hasOpenMenu) {
      return undefined;
    }

    const closeMenusOnOutsideClick = (event) => {
      if (
        blockRef.current?.contains(event.target)
        || event.target.closest?.('[data-block-dropdown-menu="true"]')
      ) {
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
      newValue = e.target.value;
    } else if (action === WHEN_I_RECEIVE) {
      newValue = e.target.value;
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

  const inputClassName = `${INPUT_BASE_CLASSNAME} ${isWorkspaceBlock ? WORKSPACE_INPUT_CLASSNAME : PALETTE_INPUT_CLASSNAME}`;
  const wrapperColorClassName = type === MOTION
    ? 'bg-blue-500'
    : type === SOUND
      ? 'bg-pink-500'
      : type === SPRITE
        ? 'bg-orange-500'
        : type === EVENTS
          ? 'bg-yellow-500'
          : type === CONTROLS
            ? 'bg-amber-500'
            : type === OPERATORS
              ? 'bg-green-500'
              : type === VARIABLES
                ? 'bg-orange-600'
                : 'bg-purple-500';
  const blockLabel = action === WHEN_BACKDROP_SWITCHES_TO ? 'when' : action === BROADCAST_MESSAGE_FOR ? 'broadcast' : action;
  const soundIcon = SOUND_ICONS[action];
  const eventTooltip = EVENT_TOOLTIPS[action];
  const minBlockHeightClassName = type === VARIABLES && [
    ADD_TO_LIST,
    DELETE_FROM_LIST,
    INSERT_AT_LIST,
    REPLACE_ITEM_IN_LIST,
  ].includes(action)
    ? 'min-h-10'
    : '';
  const resolvedIsSelected = isSelected || selectedBlockId === id;
  const resolvedIsDeleting = isDeleting || removingBlockIds.includes(id);
  const resolvedIsNewlyPlaced = isNewlyPlaced || recentlyAddedBlockIds.includes(id);
  const rootClassName = `group relative m-1 rounded-xl p-2 text-white shadow-sm ${
    isDraggable ? 'drag-card' : ''
  } ${wrapperColorClassName} ${isDragging ? 'opacity-50' : 'opacity-100'} ${
    isWorkspaceBlock ? 'workspace-block-drop' : ''
  } ${resolvedIsNewlyPlaced ? 'workspace-block-enter' : ''} ${resolvedIsDeleting ? 'workspace-block-exit' : ''} ${
    showSnapIndicators || isTopLevelOver ? 'snap-indicator-active' : ''
  } ${minBlockHeightClassName} ${
    resolvedIsSelected ? 'ring-[2px] ring-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]' : ''
  }`;

  const RootWrapper = ({ children }) => eventTooltip ? (
    <Tooltip content={eventTooltip}>{children}</Tooltip>
  ) : children;

  const blockContent = (
    <>
      <div className="flex items-center flex-wrap gap-y-1">
        {!isOperatorBlock && type !== VARIABLES && (
          <span className="mr-2" style={{ fontSize: '0.75rem' }}>
            {soundIcon ? `${soundIcon} ${blockLabel}` : blockLabel}
          </span>
        )}
        {(action === MOVE_X || action === MOVE_Y || action === TURN_RIGHT || action === TURN_LEFT || action === POINT_IN_DIRECTION || action === CHANGE_SIZE_TO || action === CHANGE_SIZE_BY || action === SET_VOLUME || action === CHANGE_VOLUME_BY || action === WHEN_LOUDNESS_GREATER_THAN) && (
          <input
            type="number"
            min={action === SET_VOLUME ? 0 : action === WHEN_LOUDNESS_GREATER_THAN ? 1 : undefined}
            max={(action === SET_VOLUME || action === WHEN_LOUDNESS_GREATER_THAN) ? 100 : undefined}
            value={value}
            onChange={handleInputChange}
            className={`${inputClassName} w-12`}
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
              value={typeof value === 'object' ? (value.message || '') : value}
              onChange={handleInputChange}
              className="w-24 p-1 text-black rounded-full mr-1"
              placeholder="message"
              style={{ fontSize: '0.75rem' }}
            />
          </>
        )}
        {action === WHEN_I_RECEIVE && (
          <>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>I receive</span>
            <input
              type="text"
              value={value}
              onChange={handleInputChange}
              className="w-20 p-1 text-black rounded-full"
              placeholder="message"
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
                ref={keyMenuTriggerRef}
                type="button"
                onClick={() => setIsKeyMenuOpen((isOpen) => !isOpen)}
                className={`${DROPDOWN_PILL_CLASSNAME} w-20`}
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedKeyOption.label}</span>
                <span className="dropdown-chevron">˅</span>
              </button>
              <BlockDropdownMenu isOpen={isKeyMenuOpen} triggerRef={keyMenuTriggerRef} width={144}>
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
              </BlockDropdownMenu>
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
              className={`${inputClassName} mr-1 w-12`}
              placeholder="X"
              style={{ fontSize: '0.75rem' }}
            />
            <input
              type="number"
              value={value[1]}
              onChange={(e) => handleInputChange(e, 1)}
              className={`${inputClassName} w-12`}
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
            className={`${inputClassName} w-16`}
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
              className={`${inputClassName} mr-1 w-16`}
              placeholder="message"
              style={{ fontSize: '0.75rem' }}
            />
            <input
              type="number"
              value={value.duration}
              onChange={(e) => handleInputChange(e, 'duration')}
              className={`${inputClassName} w-12`}
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
              ref={backdropMenuTriggerRef}
              type="button"
              onClick={() => setIsBackdropMenuOpen((isOpen) => !isOpen)}
              className={`${DROPDOWN_PILL_CLASSNAME} w-20`}
              style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
            >
              <span className="truncate">{selectedBackdropOption?.name || 'Backdrop'}</span>
              <span className="dropdown-chevron">˅</span>
            </button>
            <BlockDropdownMenu isOpen={isBackdropMenuOpen} triggerRef={backdropMenuTriggerRef} width={176}>
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
            </BlockDropdownMenu>
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
              ref={soundMenuTriggerRef}
              type="button"
              onClick={() => setIsSoundMenuOpen((isOpen) => !isOpen)}
              className={`${DROPDOWN_PILL_CLASSNAME} w-20`}
              style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
            >
              <span className="truncate">{selectedSoundOption?.name || 'Sound'}</span>
              <span className="dropdown-chevron">˅</span>
            </button>
            <BlockDropdownMenu isOpen={isSoundMenuOpen} triggerRef={soundMenuTriggerRef} width={176}>
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
            </BlockDropdownMenu>
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
                ref={(node) => {
                  variableMenuTriggerRefs.current['set-variable'] = node;
                }}
                type="button"
                onClick={() => setActiveVariableMenu((current) => current === 'set-variable' ? null : 'set-variable')}
                className={`${DROPDOWN_PILL_CLASSNAME} mr-1 w-20`}
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedVariableName || 'variable'}</span>
                <span className="dropdown-chevron">˅</span>
              </button>
              <BlockDropdownMenu isOpen={activeVariableMenu === 'set-variable'} triggerRef={{ current: variableMenuTriggerRefs.current['set-variable'] }} width={176}>
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
              </BlockDropdownMenu>
            </div>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>to</span>
            <input
              type="text"
              value={value?.input ?? ''}
              onChange={(event) => handleInputChange(event, 'input')}
              className={`${inputClassName} w-16`}
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
                ref={(node) => {
                  variableMenuTriggerRefs.current['change-variable'] = node;
                }}
                type="button"
                onClick={() => setActiveVariableMenu((current) => current === 'change-variable' ? null : 'change-variable')}
                className={`${DROPDOWN_PILL_CLASSNAME} mr-1 w-20`}
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedVariableName || 'variable'}</span>
                <span className="dropdown-chevron">˅</span>
              </button>
              <BlockDropdownMenu isOpen={activeVariableMenu === 'change-variable'} triggerRef={{ current: variableMenuTriggerRefs.current['change-variable'] }} width={176}>
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
              </BlockDropdownMenu>
            </div>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>by</span>
            <input
              type="number"
              value={value?.amount ?? ''}
              onChange={(event) => handleInputChange(event, 'amount')}
              className={`${inputClassName} w-14`}
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
              className={`${inputClassName} mr-1 w-14`}
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
                ref={(node) => {
                  listMenuTriggerRefs.current['add-to-list'] = node;
                }}
                type="button"
                onClick={() => setActiveListMenu((current) => current === 'add-to-list' ? null : 'add-to-list')}
                className={`${DROPDOWN_PILL_CLASSNAME} w-20`}
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedListName || 'list'}</span>
                <span className="dropdown-chevron">˅</span>
              </button>
              <BlockDropdownMenu isOpen={activeListMenu === 'add-to-list'} triggerRef={{ current: listMenuTriggerRefs.current['add-to-list'] }} width={176}>
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
              </BlockDropdownMenu>
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
              className={`${inputClassName} mr-1 w-12`}
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
                ref={(node) => {
                  listMenuTriggerRefs.current['delete-from-list'] = node;
                }}
                type="button"
                onClick={() => setActiveListMenu((current) => current === 'delete-from-list' ? null : 'delete-from-list')}
                className={`${DROPDOWN_PILL_CLASSNAME} w-20`}
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedListName || 'list'}</span>
                <span className="dropdown-chevron">˅</span>
              </button>
              <BlockDropdownMenu isOpen={activeListMenu === 'delete-from-list'} triggerRef={{ current: listMenuTriggerRefs.current['delete-from-list'] }} width={176}>
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
              </BlockDropdownMenu>
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
                ref={(node) => {
                  listMenuTriggerRefs.current['delete-all-of-list'] = node;
                }}
                type="button"
                onClick={() => setActiveListMenu((current) => current === 'delete-all-of-list' ? null : 'delete-all-of-list')}
                className={`${DROPDOWN_PILL_CLASSNAME} w-20`}
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedListName || 'list'}</span>
                <span className="dropdown-chevron">˅</span>
              </button>
              <BlockDropdownMenu isOpen={activeListMenu === 'delete-all-of-list'} triggerRef={{ current: listMenuTriggerRefs.current['delete-all-of-list'] }} width={176}>
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
              </BlockDropdownMenu>
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
              className={`${inputClassName} mr-1 w-14`}
              style={{ fontSize: '0.75rem' }}
            />
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>at</span>
            <input
              type="number"
              value={value?.index ?? ''}
              onChange={(event) => handleInputChange(event, 'index')}
              className={`${inputClassName} mr-1 w-12`}
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
                ref={(node) => {
                  listMenuTriggerRefs.current['insert-at-list'] = node;
                }}
                type="button"
                onClick={() => setActiveListMenu((current) => current === 'insert-at-list' ? null : 'insert-at-list')}
                className={`${DROPDOWN_PILL_CLASSNAME} w-20`}
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedListName || 'list'}</span>
                <span className="dropdown-chevron">˅</span>
              </button>
              <BlockDropdownMenu isOpen={activeListMenu === 'insert-at-list'} triggerRef={{ current: listMenuTriggerRefs.current['insert-at-list'] }} width={176}>
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
              </BlockDropdownMenu>
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
              className={`${inputClassName} mr-1 w-12`}
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
                ref={(node) => {
                  listMenuTriggerRefs.current['replace-item-in-list'] = node;
                }}
                type="button"
                onClick={() => setActiveListMenu((current) => current === 'replace-item-in-list' ? null : 'replace-item-in-list')}
                className={`${DROPDOWN_PILL_CLASSNAME} mr-1 w-20`}
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{selectedListName || 'list'}</span>
                <span className="dropdown-chevron">˅</span>
              </button>
              <BlockDropdownMenu isOpen={activeListMenu === 'replace-item-in-list'} triggerRef={{ current: listMenuTriggerRefs.current['replace-item-in-list'] }} width={176}>
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
              </BlockDropdownMenu>
            </div>
            <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>with</span>
            <input
              type="text"
              value={value?.item ?? ''}
              onChange={(event) => handleInputChange(event, 'item')}
              className={`${inputClassName} w-14`}
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
              className={`${inputClassName} mr-1 w-12`}
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
              className={`${inputClassName} mr-1 w-12`}
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
                ref={mathMenuTriggerRef}
                type="button"
                onClick={() => setIsMathMenuOpen((isOpen) => !isOpen)}
                className={`${DROPDOWN_PILL_CLASSNAME} mr-1 w-20`}
                style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
              >
                <span className="truncate">{value.fn}</span>
                <span className="dropdown-chevron">˅</span>
              </button>
              <BlockDropdownMenu isOpen={isMathMenuOpen} triggerRef={mathMenuTriggerRef} width={96}>
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
              </BlockDropdownMenu>
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
      <RootWrapper>
        <div
          style={{ maxWidth: 280 }}
          ref={attachBlockRef}
          onClick={() => onSelect?.(id)}
          className={rootClassName}
        >
          {isWorkspaceBlock && onRequestRemove ? (
            <Tooltip content="Delete block" shortcut="Del">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRequestRemove(id);
                }}
                className="block-delete-button absolute right-1 top-1 hidden items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm group-hover:flex"
              >
                ×
              </button>
            </Tooltip>
          ) : null}
          {blockContent}
        <div
          ref={attachNestedDropRef}
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
                selectedBlockId={selectedBlockId}
                onSelect={onSelect}
                onRequestRemove={onRequestRemove}
                removingBlockIds={removingBlockIds}
                recentlyAddedBlockIds={recentlyAddedBlockIds}
              />
            ))
          )}
        </div>
        {action === IF_THEN_ELSE && (
          <div
            ref={attachElseNestedDropRef}
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
                  selectedBlockId={selectedBlockId}
                  onSelect={onSelect}
                  onRequestRemove={onRequestRemove}
                  removingBlockIds={removingBlockIds}
                  recentlyAddedBlockIds={recentlyAddedBlockIds}
                />
              ))
            )}
          </div>
        )}
        </div>
      </RootWrapper>
    );
  }

  return (
    <RootWrapper>
      <div
        style={{ maxWidth: 220 }}
        ref={attachBlockRef}
        onClick={() => onSelect?.(id)}
        className={`${rootClassName} flex items-center ${action === BROADCAST_MESSAGE_FOR ? 'flex-wrap gap-y-1' : ''} ${!isWorkspaceBlock ? 'block-hover-lift' : ''}`}
      >
        {isWorkspaceBlock && onRequestRemove ? (
          <Tooltip content="Delete block" shortcut="Del">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequestRemove(id);
              }}
              className="block-delete-button absolute right-1 top-1 hidden items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm group-hover:flex"
            >
              ×
            </button>
          </Tooltip>
        ) : null}
        {blockContent}
      </div>
    </RootWrapper>
  );
};

export default Block;
