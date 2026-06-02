import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { CONTROLS, EVENTS, MOTION, OPERATORS, SOUND, SPRITE, VARIABLES } from '../../../constants/BlockTypes';
import {
  ADD_TO_LIST,
  BROADCAST_MESSAGE_FOR,
  CHANGE_BACKDROP,
  CHANGE_VARIABLE_BY,
  CHANGE_VOLUME_BY,
  DELETE_ALL_OF_LIST,
  DELETE_FROM_LIST,
  GOTO,
  IF_THEN_ELSE,
  INSERT_AT_LIST,
  OPERATOR_CONTAINS,
  OPERATOR_JOIN,
  OPERATOR_LENGTH_OF,
  OPERATOR_LETTER_OF,
  OPERATOR_PICK_RANDOM,
  PLAY_SOUND,
  SAY_TIMER,
  REPEAT_TIMES,
  REPLACE_ITEM_IN_LIST,
  SET_VARIABLE_TO,
  SET_VOLUME,
  THINK_TIMER,
  WAIT_SECONDS,
  WHEN_I_RECEIVE,
  WHEN_LOUDNESS_GREATER_THAN,
} from '../../../constants/ActionTypes';
import Tooltip from '../components/Tooltip';
import BlockContent from './BlockContent';
import NestedBlockDropZone from './NestedBlockDropZone';
import {
  CONTROL_CONTAINER_ACTIONS,
  EVENT_TRIGGER_ACTIONS,
  EVENT_TOOLTIPS,
  INPUT_BASE_CLASSNAME,
  KEY_OPTIONS,
  OPERATOR_ACTIONS,
  OPERATOR_NUMBER_MAX,
  OPERATOR_NUMBER_MIN,
  PALETTE_INPUT_CLASSNAME,
  RECORD_SOUND_OPTION,
  UPLOAD_BACKDROP_OPTION,
  WORKSPACE_INPUT_CLASSNAME,
} from './blockConstants';

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
  const minBlockHeightClassName = type === VARIABLES && [
    DELETE_FROM_LIST,
    INSERT_AT_LIST,
    REPLACE_ITEM_IN_LIST,
  ].includes(action)
    ? 'min-h-10'
    : '';
  const resolvedIsSelected = isSelected || selectedBlockId === id;
  const resolvedIsDeleting = isDeleting || removingBlockIds.includes(id);
  const resolvedIsNewlyPlaced = isNewlyPlaced || recentlyAddedBlockIds.includes(id);
  const rootClassName = `block group relative my-1 rounded-xl text-white shadow-sm ${
    isDraggable ? 'drag-card' : ''
  } ${wrapperColorClassName} ${isDragging ? 'opacity-50' : 'opacity-100'} ${
    isWorkspaceBlock ? 'workspace-block-drop' : ''
  } ${resolvedIsNewlyPlaced ? 'workspace-block-enter' : ''} ${resolvedIsDeleting ? 'workspace-block-exit' : ''} ${
    showSnapIndicators || isTopLevelOver ? 'snap-indicator-active' : ''
  } ${minBlockHeightClassName} ${
    resolvedIsSelected ? 'selected outline outline-2 outline-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]' : ''
  } ${type === CONTROLS ? 'block-control' : ''} ${isWorkspaceBlock ? 'workspace-block' : 'palette-block'} ${
    isDragging ? 'dragging' : ''
  }`;

  const eventTooltip = EVENT_TOOLTIPS[action];

  const RootWrapper = ({ children }) => eventTooltip ? (
    <Tooltip content={eventTooltip}>{children}</Tooltip>
  ) : children;

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
                className="block-delete-button absolute right-1 top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[13px] leading-none text-slate-700 shadow-sm group-hover:flex"
              >
                ×
              </button>
            </Tooltip>
          ) : null}
          <BlockContent
            BlockComponent={Block}
            id={id}
            type={type}
            action={action}
            value={value}
            isWorkspaceBlock={isWorkspaceBlock}
            isOperatorBlock={isOperatorBlock}
            inputClassName={inputClassName}
            availableSounds={availableSounds}
            availableVariables={availableVariables}
            availableLists={availableLists}
            availableBackdrops={availableBackdrops}
            isRecordingSound={isRecordingSound}
            selectedKeyOption={selectedKeyOption}
            selectedBackdropOption={selectedBackdropOption}
            selectedSoundOption={selectedSoundOption}
            selectedVariableName={selectedVariableName}
            selectedListName={selectedListName}
            isKeyMenuOpen={isKeyMenuOpen}
            setIsKeyMenuOpen={setIsKeyMenuOpen}
            isBackdropMenuOpen={isBackdropMenuOpen}
            setIsBackdropMenuOpen={setIsBackdropMenuOpen}
            isSoundMenuOpen={isSoundMenuOpen}
            setIsSoundMenuOpen={setIsSoundMenuOpen}
            isMathMenuOpen={isMathMenuOpen}
            setIsMathMenuOpen={setIsMathMenuOpen}
            activeVariableMenu={activeVariableMenu}
            setActiveVariableMenu={setActiveVariableMenu}
            activeListMenu={activeListMenu}
            setActiveListMenu={setActiveListMenu}
            keyMenuTriggerRef={keyMenuTriggerRef}
            backdropMenuTriggerRef={backdropMenuTriggerRef}
            soundMenuTriggerRef={soundMenuTriggerRef}
            mathMenuTriggerRef={mathMenuTriggerRef}
            variableMenuTriggerRefs={variableMenuTriggerRefs}
            listMenuTriggerRefs={listMenuTriggerRefs}
            onChange={onChange}
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
            stopControlDrag={stopControlDrag}
            handleInputChange={handleInputChange}
            handleKeyOptionSelect={handleKeyOptionSelect}
            handleBackdropOptionSelect={handleBackdropOptionSelect}
            handleSoundOptionSelect={handleSoundOptionSelect}
            handleVariableOptionSelect={handleVariableOptionSelect}
            handleListOptionSelect={handleListOptionSelect}
            handleOperatorSlotNumberChange={handleOperatorSlotNumberChange}
            handleMathFunctionSelect={handleMathFunctionSelect}
            handleDeleteVariableEntity={handleDeleteVariableEntity}
            handleOperatorSlotDrop={handleOperatorSlotDrop}
          />
          <NestedBlockDropZone
            innerRef={attachNestedDropRef}
            isOver={isNestedOver}
            blocks={childrenBlocks}
            parentId={id}
            parentSlot="children"
            onChange={onNestedBlockChange}
            onRemove={onNestedBlockRemove}
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
        {action === IF_THEN_ELSE && (
          <NestedBlockDropZone
            innerRef={attachElseNestedDropRef}
            isOver={isElseNestedOver}
            blocks={elseChildrenBlocks}
            parentId={id}
            parentSlot="elseChildren"
            onChange={onNestedBlockChange}
            onRemove={onNestedBlockRemove}
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
            heading="else"
          />
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
        className={`${rootClassName} flex items-center ${action === BROADCAST_MESSAGE_FOR ? 'flex-wrap gap-y-1' : ''} ${!isWorkspaceBlock ? 'block-hover-lift transition-[filter] duration-120 ease-out' : ''} ${type === OPERATORS ? 'block-operators' : ''}`}
      >
        {isWorkspaceBlock && onRequestRemove ? (
          <Tooltip content="Delete block" shortcut="Del">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequestRemove(id);
              }}
              className="block-delete-button absolute right-1 top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[13px] leading-none text-slate-700 shadow-sm group-hover:flex"
            >
              ×
            </button>
          </Tooltip>
        ) : null}
        <BlockContent
          BlockComponent={Block}
          id={id}
          type={type}
          action={action}
          value={value}
          isWorkspaceBlock={isWorkspaceBlock}
          isOperatorBlock={isOperatorBlock}
          inputClassName={inputClassName}
          availableSounds={availableSounds}
          availableVariables={availableVariables}
          availableLists={availableLists}
          availableBackdrops={availableBackdrops}
          isRecordingSound={isRecordingSound}
          selectedKeyOption={selectedKeyOption}
          selectedBackdropOption={selectedBackdropOption}
          selectedSoundOption={selectedSoundOption}
          selectedVariableName={selectedVariableName}
          selectedListName={selectedListName}
          isKeyMenuOpen={isKeyMenuOpen}
          setIsKeyMenuOpen={setIsKeyMenuOpen}
          isBackdropMenuOpen={isBackdropMenuOpen}
          setIsBackdropMenuOpen={setIsBackdropMenuOpen}
          isSoundMenuOpen={isSoundMenuOpen}
          setIsSoundMenuOpen={setIsSoundMenuOpen}
          isMathMenuOpen={isMathMenuOpen}
          setIsMathMenuOpen={setIsMathMenuOpen}
          activeVariableMenu={activeVariableMenu}
          setActiveVariableMenu={setActiveVariableMenu}
          activeListMenu={activeListMenu}
          setActiveListMenu={setActiveListMenu}
          keyMenuTriggerRef={keyMenuTriggerRef}
          backdropMenuTriggerRef={backdropMenuTriggerRef}
          soundMenuTriggerRef={soundMenuTriggerRef}
          mathMenuTriggerRef={mathMenuTriggerRef}
          variableMenuTriggerRefs={variableMenuTriggerRefs}
          listMenuTriggerRefs={listMenuTriggerRefs}
          onChange={onChange}
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
          stopControlDrag={stopControlDrag}
          handleInputChange={handleInputChange}
          handleKeyOptionSelect={handleKeyOptionSelect}
          handleBackdropOptionSelect={handleBackdropOptionSelect}
          handleSoundOptionSelect={handleSoundOptionSelect}
          handleVariableOptionSelect={handleVariableOptionSelect}
          handleListOptionSelect={handleListOptionSelect}
          handleOperatorSlotNumberChange={handleOperatorSlotNumberChange}
          handleMathFunctionSelect={handleMathFunctionSelect}
          handleDeleteVariableEntity={handleDeleteVariableEntity}
          handleOperatorSlotDrop={handleOperatorSlotDrop}
        />
      </div>
    </RootWrapper>
  );
};

export default Block;
