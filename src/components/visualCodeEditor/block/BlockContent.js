import React from 'react';
import { CONTROLS, VARIABLES } from '../../../constants/BlockTypes';
import {
  ADD_TO_LIST,
  BROADCAST_MESSAGE_FOR,
  CHANGE_BACKDROP,
  CHANGE_COLOR,
  CHANGE_SIZE_BY,
  CHANGE_SIZE_TO,
  CHANGE_VARIABLE_BY,
  CHANGE_VOLUME_BY,
  CLEAR_ALL_SOUNDS,
  DELETE_ALL_OF_LIST,
  DELETE_FROM_LIST,
  FOREVER,
  GOTO,
  GOTO_RANDOM,
  HIDE,
  IF_THEN,
  IF_THEN_ELSE,
  INSERT_AT_LIST,
  LIST_REPORTER,
  MOVE_X,
  MOVE_Y,
  OPERATOR_CONTAINS,
  OPERATOR_JOIN,
  OPERATOR_LETTER_OF,
  OPERATOR_LENGTH_OF,
  OPERATOR_MATH_FUNCTION,
  OPERATOR_NOT,
  OPERATOR_PICK_RANDOM,
  PLAY_SOUND,
  POINT_IN_DIRECTION,
  POINT_TOWARDS_RANDOM,
  REPEAT_TIMES,
  REPEAT_UNTIL,
  REPLACE_ITEM_IN_LIST,
  SAY,
  SAY_TIMER,
  SET_VARIABLE_TO,
  SET_VOLUME,
  SHOW,
  THINK,
  THINK_TIMER,
  TURN_LEFT,
  TURN_RIGHT,
  VARIABLE_REPORTER,
  WAIT_SECONDS,
  WAIT_UNTIL,
  WHEN_BACKDROP_SWITCHES_TO,
  WHEN_I_RECEIVE,
  WHEN_KEY_PRESSED,
  WHEN_LOUDNESS_GREATER_THAN,
  WHEN_SPRITE_CLICKED,
} from '../../../constants/ActionTypes';
import BlockDropdownMenu from './BlockDropdownMenu';
import OperatorSlot from './OperatorSlot';
import {
  DROPDOWN_PILL_CLASSNAME,
  KEY_OPTIONS,
  MATH_FUNCTION_OPTIONS,
  OPERATOR_NUMBER_MAX,
  OPERATOR_NUMBER_MIN,
  RECORD_SOUND_OPTION,
  SOUND_ICONS,
  EVENT_TOOLTIPS,
  UPLOAD_BACKDROP_OPTION,
} from './blockConstants';

const BlockContent = ({
  BlockComponent,
  id,
  type,
  action,
  value,
  isWorkspaceBlock,
  isOperatorBlock,
  inputClassName,
  availableSounds,
  availableVariables,
  availableLists,
  availableBackdrops,
  isRecordingSound,
  selectedKeyOption,
  selectedBackdropOption,
  selectedSoundOption,
  selectedVariableName,
  selectedListName,
  isKeyMenuOpen,
  setIsKeyMenuOpen,
  isBackdropMenuOpen,
  setIsBackdropMenuOpen,
  isSoundMenuOpen,
  setIsSoundMenuOpen,
  isMathMenuOpen,
  setIsMathMenuOpen,
  activeVariableMenu,
  setActiveVariableMenu,
  activeListMenu,
  setActiveListMenu,
  keyMenuTriggerRef,
  backdropMenuTriggerRef,
  soundMenuTriggerRef,
  mathMenuTriggerRef,
  variableMenuTriggerRefs,
  listMenuTriggerRefs,
  onChange,
  onSoundMenuAction,
  onBackdropMenuAction,
  onNestedDrop,
  onNestedBlockChange,
  onNestedBlockRemove,
  onOperatorSlotChange,
  onOperatorSlotDrop,
  onOperatorValidationMessage,
  onDeleteVariableEntity,
  selectedBlockId,
  onSelect,
  onRequestRemove,
  removingBlockIds,
  recentlyAddedBlockIds,
  stopControlDrag,
  handleInputChange,
  handleKeyOptionSelect,
  handleBackdropOptionSelect,
  handleSoundOptionSelect,
  handleVariableOptionSelect,
  handleListOptionSelect,
  handleOperatorSlotNumberChange,
  handleMathFunctionSelect,
  handleDeleteVariableEntity,
  handleOperatorSlotDrop,
}) => {
  const blockLabel = action === WHEN_BACKDROP_SWITCHES_TO ? 'when' : action === BROADCAST_MESSAGE_FOR ? 'broadcast' : action;
  const soundIcon = SOUND_ICONS[action];
  const eventTooltip = EVENT_TOOLTIPS[action];

  const operatorSlotProps = {
    BlockComponent,
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
    selectedBlockId,
    onSelect,
    onRequestRemove,
    removingBlockIds,
    recentlyAddedBlockIds,
  };

  return (
    <div className="flex items-center flex-wrap gap-x-1 gap-y-1">
      {!isOperatorBlock && type !== VARIABLES && (
        <span className="mr-2" style={{ fontSize: '0.75rem' }}>
          {soundIcon ? `${soundIcon} ${blockLabel}` : blockLabel}
        </span>
      )}
      {(action === MOVE_X || action === MOVE_Y || action === TURN_RIGHT || action === TURN_LEFT || action === POINT_IN_DIRECTION || action === CHANGE_SIZE_TO || action === CHANGE_SIZE_BY || action === SET_VOLUME || action === CHANGE_VOLUME_BY || action === WHEN_LOUDNESS_GREATER_THAN) && (
        <input
          type="number"
          inputMode="numeric"
          min={action === SET_VOLUME ? 0 : action === WHEN_LOUDNESS_GREATER_THAN ? 1 : undefined}
          max={(action === SET_VOLUME || action === WHEN_LOUDNESS_GREATER_THAN) ? 100 : undefined}
          value={value}
          onChange={handleInputChange}
          className={`${inputClassName} w-14 ${isOperatorBlock ? 'bg-white/85 text-[#1a1a1a]' : ''}`}
          style={{ fontSize: '0.75rem' }}
        />
      )}
      {action === SET_VOLUME && <span className="ml-1" style={{ fontSize: '0.75rem' }}>%</span>}
      {action === CHANGE_VOLUME_BY && <span className="ml-1" style={{ fontSize: '0.75rem' }}>%</span>}
      {action === WHEN_LOUDNESS_GREATER_THAN && <span className="ml-1" style={{ fontSize: '0.75rem' }}>%</span>}
      {action === BROADCAST_MESSAGE_FOR && (
        <input
          type="text"
          value={typeof value === 'object' ? (value.message || '') : value}
          onChange={handleInputChange}
          className="w-24 p-1 text-black rounded-full mr-1"
          placeholder="message"
          style={{ fontSize: '0.75rem' }}
        />
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
      {action === GOTO_RANDOM && <span style={{ fontSize: '0.75rem' }} />}
      {action === GOTO && (
        <>
          <input
            type="number"
            inputMode="numeric"
            value={value[0]}
            onChange={(event) => handleInputChange(event, 0)}
            className={`${inputClassName} mr-1 w-14`}
            placeholder="X"
            style={{ fontSize: '0.75rem' }}
          />
          <input
            type="number"
            inputMode="numeric"
            value={value[1]}
            onChange={(event) => handleInputChange(event, 1)}
            className={`${inputClassName} w-14`}
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
            onChange={(event) => handleInputChange(event, 'message')}
            className={`${inputClassName} mr-1 w-16`}
            placeholder="message"
            style={{ fontSize: '0.75rem' }}
          />
          <input
            type="number"
            inputMode="numeric"
            value={value.duration}
            onChange={(event) => handleInputChange(event, 'duration')}
            className={`${inputClassName} w-14`}
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
        <span style={{ fontSize: '0.75rem' }} />
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
            title={eventTooltip}
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
          <div className="relative flex-shrink-0" onPointerDown={stopControlDrag} onMouseDown={stopControlDrag} onTouchStart={stopControlDrag}>
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
          <div className="relative flex-shrink-0" onPointerDown={stopControlDrag} onMouseDown={stopControlDrag} onTouchStart={stopControlDrag}>
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
            inputMode="numeric"
            value={value?.amount ?? ''}
            onChange={(event) => handleInputChange(event, 'amount')}
            className={`${inputClassName} w-16`}
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
            className={`${inputClassName} mr-1 w-16`}
            style={{ fontSize: '0.75rem' }}
          />
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>to list</span>
          <div className="relative flex-shrink-0" onPointerDown={stopControlDrag} onMouseDown={stopControlDrag} onTouchStart={stopControlDrag}>
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
            inputMode="numeric"
            value={value?.index ?? ''}
            onChange={(event) => handleInputChange(event, 'index')}
            className={`${inputClassName} mr-1 w-14`}
            style={{ fontSize: '0.75rem' }}
          />
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>of list</span>
          <div className="relative flex-shrink-0" onPointerDown={stopControlDrag} onMouseDown={stopControlDrag} onTouchStart={stopControlDrag}>
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
          <div className="relative flex-shrink-0" onPointerDown={stopControlDrag} onMouseDown={stopControlDrag} onTouchStart={stopControlDrag}>
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
            className={`${inputClassName} mr-1 w-16`}
            style={{ fontSize: '0.75rem' }}
          />
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>at</span>
          <input
            type="number"
            inputMode="numeric"
            value={value?.index ?? ''}
            onChange={(event) => handleInputChange(event, 'index')}
            className={`${inputClassName} mr-1 w-14`}
            style={{ fontSize: '0.75rem' }}
          />
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>of</span>
          <div className="relative flex-shrink-0" onPointerDown={stopControlDrag} onMouseDown={stopControlDrag} onTouchStart={stopControlDrag}>
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
            inputMode="numeric"
            value={value?.index ?? ''}
            onChange={(event) => handleInputChange(event, 'index')}
            className={`${inputClassName} mr-1 w-14`}
            style={{ fontSize: '0.75rem' }}
          />
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>of</span>
          <div className="relative flex-shrink-0" onPointerDown={stopControlDrag} onMouseDown={stopControlDrag} onTouchStart={stopControlDrag}>
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
            inputMode="numeric"
            min={0}
            value={value}
            onChange={handleInputChange}
            className={`${inputClassName} mr-1 w-14`}
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
            inputMode="numeric"
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
          <OperatorSlot ownerId={id} slotName="condition" slotValue={value?.condition} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} {...operatorSlotProps} />
          <span className="ml-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>then</span>
        </>
      )}
      {type === CONTROLS && action === IF_THEN_ELSE && (
        <>
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>if</span>
          <OperatorSlot ownerId={id} slotName="condition" slotValue={value?.condition} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} {...operatorSlotProps} />
          <span className="ml-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>then</span>
        </>
      )}
      {type === CONTROLS && action === WAIT_UNTIL && (
        <>
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>wait until</span>
          <OperatorSlot ownerId={id} slotName="condition" slotValue={value?.condition} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} {...operatorSlotProps} />
        </>
      )}
      {type === CONTROLS && action === REPEAT_UNTIL && (
        <>
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>repeat until</span>
          <OperatorSlot ownerId={id} slotName="condition" slotValue={value?.condition} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} {...operatorSlotProps} />
        </>
      )}
      {isOperatorBlock && action === OPERATOR_PICK_RANDOM && (
        <>
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.65rem' }}>pick random</span>
          <OperatorSlot ownerId={id} slotName="left" slotValue={value.left} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} compact={true} {...operatorSlotProps} />
          <span className="mx-1 whitespace-nowrap" style={{ fontSize: '0.65rem' }}>to</span>
          <OperatorSlot ownerId={id} slotName="right" slotValue={value.right} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} compact={true} {...operatorSlotProps} />
        </>
      )}
      {isOperatorBlock && action === OPERATOR_NOT && (
        <>
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>not</span>
          <OperatorSlot ownerId={id} slotName="operand" slotValue={value.operand} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} {...operatorSlotProps} />
        </>
      )}
      {isOperatorBlock && action === OPERATOR_JOIN && (
        <>
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>join</span>
          <OperatorSlot ownerId={id} slotName="left" slotValue={value.left} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} inputType="text" {...operatorSlotProps} />
          <OperatorSlot ownerId={id} slotName="right" slotValue={value.right} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} inputType="text" {...operatorSlotProps} />
        </>
      )}
      {isOperatorBlock && action === OPERATOR_LETTER_OF && (
        <>
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>letter</span>
          <OperatorSlot ownerId={id} slotName="index" slotValue={value.index} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} {...operatorSlotProps} />
          <span className="mx-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>of</span>
          <OperatorSlot ownerId={id} slotName="source" slotValue={value.source} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} inputType="text" {...operatorSlotProps} />
        </>
      )}
      {isOperatorBlock && action === OPERATOR_LENGTH_OF && (
        <>
          <span className="mr-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>length of</span>
          <OperatorSlot ownerId={id} slotName="source" slotValue={value.source} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} inputType="text" {...operatorSlotProps} />
        </>
      )}
      {isOperatorBlock && action === OPERATOR_CONTAINS && (
        <>
          <OperatorSlot ownerId={id} slotName="source" slotValue={value.source} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} inputType="text" {...operatorSlotProps} />
          <span className="mx-1 whitespace-nowrap" style={{ fontSize: '0.75rem' }}>contains</span>
          <OperatorSlot ownerId={id} slotName="target" slotValue={value.target} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} inputType="text" minCharsOverride={5} {...operatorSlotProps} />
        </>
      )}
      {isOperatorBlock && action === OPERATOR_MATH_FUNCTION && (
        <>
          <div className="relative flex-shrink-0" onPointerDown={stopControlDrag} onMouseDown={stopControlDrag} onTouchStart={stopControlDrag}>
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
          <OperatorSlot ownerId={id} slotName="operand" slotValue={value.operand} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} {...operatorSlotProps} />
        </>
      )}
      {isOperatorBlock && action !== OPERATOR_PICK_RANDOM && action !== OPERATOR_NOT && action !== OPERATOR_JOIN && action !== OPERATOR_LETTER_OF && action !== OPERATOR_LENGTH_OF && action !== OPERATOR_CONTAINS && action !== OPERATOR_MATH_FUNCTION && (
        <>
          <OperatorSlot ownerId={id} slotName="left" slotValue={value.left} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} {...operatorSlotProps} />
          <span className="mx-1 font-semibold" style={{ fontSize: '0.875rem' }}>{action}</span>
          <OperatorSlot ownerId={id} slotName="right" slotValue={value.right} onNumberChange={handleOperatorSlotNumberChange} onOperatorDrop={handleOperatorSlotDrop} min={OPERATOR_NUMBER_MIN} max={OPERATOR_NUMBER_MAX} {...operatorSlotProps} />
        </>
      )}
    </div>
  );
};

export default BlockContent;
