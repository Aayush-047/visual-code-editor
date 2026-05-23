import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChevronDown, FileText, FolderOpen, Image as ImageIcon, Maximize2, Minimize2, Play, Rewind, Save, Search, Shapes, Upload } from 'lucide-react';
import Block from './Block';
import DroppableArea from './DroppableArea';
import SpeechBubble from './SpeechBubble';
import SpriteGraphic from './SpriteGraphic';
import SpritePaintEditor from './SpritePaintEditor';
import { EVENTS, MOTION, LOOKS, SOUND, SPRITE, CONTROLS, OPERATORS, VARIABLES } from '../constants/BlockTypes';
import useExecuteAction from '../hooks/useExecuteAction';
import * as actionTypes from '../constants/ActionTypes';

const DEFAULT_SOUNDS = [
  { id: 'meow', name: 'Meow', type: 'builtin', url: '/sounds/Meow.mp3' },
];

const SPRITE_LIBRARY = [
  { id: 'cat', name: 'Cat', src: '/assets/sprites/cat.svg', color: '#FFAB19' },
  { id: 'sky-cat', name: 'Sky Cat', src: '/assets/sprites/cat.svg', color: '#38BDF8' },
  { id: 'mint-cat', name: 'Mint Cat', src: '/assets/sprites/cat.svg', color: '#34D399' },
  { id: 'rose-cat', name: 'Rose Cat', src: '/assets/sprites/cat.svg', color: '#FB7185' },
];
const BACKDROP_LIBRARY = [
  { id: 'white-space', name: 'White Space', url: '', type: 'builtin' },
  { id: 'beach', name: 'Beach', url: '/assets/backdrops/beach1.png', type: 'builtin' },
  { id: 'forest', name: 'Forest', url: '/assets/backdrops/forest.png', type: 'builtin' },
  { id: 'city', name: 'City', url: '/assets/backdrops/city.png', type: 'builtin' },
  { id: 'space', name: 'Space', url: '/assets/backdrops/space', type: 'builtin' },
];

const RECORD_SOUND_OPTION = '__record_sound__';
const EDITOR_PANEL_HEIGHT = 'min(600px, calc(100vh - 14rem))';
const EMPTY_BLOCKS = [];
const EVENT_TRIGGER_ACTIONS = [
  actionTypes.WHEN_KEY_PRESSED,
  actionTypes.WHEN_SPRITE_CLICKED,
  actionTypes.WHEN_BACKDROP_SWITCHES_TO,
  actionTypes.WHEN_LOUDNESS_GREATER_THAN,
  actionTypes.WHEN_I_RECEIVE,
];
const CONTROL_CONTAINER_ACTIONS = [
  actionTypes.REPEAT_TIMES,
  actionTypes.FOREVER,
  actionTypes.IF_THEN,
  actionTypes.IF_THEN_ELSE,
  actionTypes.REPEAT_UNTIL,
];

const isEventTriggerAction = (action) => EVENT_TRIGGER_ACTIONS.includes(action);
const isControlContainerAction = (action) => CONTROL_CONTAINER_ACTIONS.includes(action);
const OPERATOR_ACTIONS = [
  actionTypes.OPERATOR_ADD,
  actionTypes.OPERATOR_SUBTRACT,
  actionTypes.OPERATOR_MULTIPLY,
  actionTypes.OPERATOR_DIVIDE,
  actionTypes.OPERATOR_MODULO,
  actionTypes.OPERATOR_LESS_THAN,
  actionTypes.OPERATOR_EQUALS,
  actionTypes.OPERATOR_GREATER_THAN,
  actionTypes.OPERATOR_AND,
  actionTypes.OPERATOR_OR,
  actionTypes.OPERATOR_NOT,
  actionTypes.OPERATOR_JOIN,
  actionTypes.OPERATOR_LETTER_OF,
  actionTypes.OPERATOR_LENGTH_OF,
  actionTypes.OPERATOR_CONTAINS,
  actionTypes.OPERATOR_MATH_FUNCTION,
  actionTypes.OPERATOR_PICK_RANDOM,
];
const TIMED_ACTIONS = new Set([
  actionTypes.SAY,
  actionTypes.THINK,
  actionTypes.SAY_TIMER,
  actionTypes.THINK_TIMER,
  actionTypes.BROADCAST_MESSAGE_FOR,
  actionTypes.PLAY_SOUND,
]);

const isOperatorAction = (action) => OPERATOR_ACTIONS.includes(action);
const isVariableReporterAction = (action) => action === actionTypes.VARIABLE_REPORTER || action === actionTypes.LIST_REPORTER;
const shouldApplyStepDelay = (block) => !TIMED_ACTIONS.has(block?.action);

const describeBlock = (block) => {
  if (!block) return 'Unknown block';

  if (block.action === actionTypes.WHEN_KEY_PRESSED) {
    return `when ${block.value} key pressed`;
  }

  if (block.action === actionTypes.WHEN_BACKDROP_SWITCHES_TO) {
    return `when backdrop switches to ${block.value}`;
  }

  if (block.action === actionTypes.WHEN_I_RECEIVE) {
    return `when I receive ${block.value}`;
  }

  if (block.type === VARIABLES && block.value?.name) {
    return `${block.action} ${block.value.name}`;
  }

  return block.action;
};

const StagePreview = ({
  previewRef,
  spriteRef,
  sprites,
  selectedSpriteId,
  selectedBackdrop,
  onSpritePointerDown,
  onSpritePointerMove,
  onSpritePointerUp,
  onSpriteClick,
  isInteractive = true,
  panelHeight = EDITOR_PANEL_HEIGHT,
  className = 'border p-4 relative overflow-x-auto overflow-y-auto',
}) => (
  <div
    ref={previewRef}
    className={className}
    style={{
      height: panelHeight,
      minHeight: panelHeight,
      backgroundColor: selectedBackdrop?.url ? undefined : 'white',
      backgroundImage: selectedBackdrop?.url ? `url(${selectedBackdrop.url})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    {sprites.map((sprite) => {
      const isSelectedSprite = sprite.id === selectedSpriteId;

      return (
        <div
          key={sprite.id}
          ref={isSelectedSprite ? spriteRef : null}
          className={`absolute left-1/2 top-1/2 transition-all duration-300 select-none ${
            isInteractive && isSelectedSprite ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onPointerDown={isInteractive && isSelectedSprite ? onSpritePointerDown : undefined}
          onPointerMove={isInteractive && isSelectedSprite ? onSpritePointerMove : undefined}
          onPointerUp={isInteractive && isSelectedSprite ? onSpritePointerUp : undefined}
          onPointerCancel={isInteractive && isSelectedSprite ? onSpritePointerUp : undefined}
          onClick={isInteractive && isSelectedSprite ? onSpriteClick : undefined}
          style={{
            touchAction: isSelectedSprite ? 'none' : 'auto',
            transform: `translate(calc(-50% + ${sprite.spriteState.x}px), calc(-50% + ${sprite.spriteState.y}px))`,
            opacity: sprite.spriteState.visible === false ? 0 : 1,
            zIndex: isSelectedSprite ? 10 : 1,
          }}
        >
          {sprite.speechBubble?.message && (
            <SpeechBubble message={sprite.speechBubble.message} isThinking={sprite.speechBubble.isThinking} />
          )}
          <div
            className="h-24 w-24"
            style={{
              transform: `rotate(${sprite.spriteState.rotation + 90}deg) scale(${sprite.spriteState.size / 100})`,
              transformOrigin: 'center center',
            }}
          >
            <SpriteGraphic src={sprite.src} markup={sprite.svgMarkup} color={sprite.color} />
          </div>
        </div>
      );
    })}
  </div>
);

const PreviewControls = ({
  isRunning,
  replayableBlocks,
  selectedReplayBlock,
  selectedReplayBlockId,
  setSelectedReplayBlockId,
  runCode,
  replaySelectedBlock,
  compact = false,
}) => (
  <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'mt-4 justify-end'}`}>
    <button
      type="button"
      onClick={runCode}
      disabled={isRunning}
      className={`rounded bg-green-500 p-2 text-white flex items-center ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Play size={16} className="mr-1" /> Run Code
    </button>
    <select
      value={selectedReplayBlock?.id || selectedReplayBlockId || ''}
      onChange={(event) => setSelectedReplayBlockId(event.target.value)}
      disabled={replayableBlocks.length === 0 || isRunning}
      className={`h-10 w-52 rounded-full border border-gray-300 bg-white px-3 text-sm text-black shadow-sm ${
        replayableBlocks.length === 0 || isRunning ? 'cursor-not-allowed opacity-50' : ''
      }`}
    >
      {replayableBlocks.length === 0 ? (
        <option value="">No replay blocks</option>
      ) : (
        replayableBlocks.map((block, blockIndex) => (
          <option key={block.id} value={block.id}>
            {blockIndex + 1}. {describeBlock(block)}
          </option>
        ))
      )}
    </select>
    <button
      type="button"
      onClick={() => void replaySelectedBlock()}
      disabled={!selectedReplayBlock || isRunning}
      className={`rounded bg-blue-500 p-2 text-white flex items-center ${(!selectedReplayBlock || isRunning) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Rewind size={16} className="mr-1" /> Replay
    </button>
  </div>
);

const cloneBlockValue = (value) => {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(cloneBlockValue);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, cloneBlockValue(entryValue)])
    );
  }

  return value;
};

const createSpriteInstance = (librarySprite) => ({
  id: `sprite-${Date.now()}-${Math.random()}`,
  libraryId: librarySprite.id,
  name: librarySprite.name,
  src: librarySprite.src,
  color: librarySprite.color,
  svgMarkup: null,
  spriteState: { x: 0, y: 0, rotation: -90, size: 100, visible: true },
  speechBubble: { message: '', isThinking: false },
  blocks: [],
});

const INITIAL_SPRITE = createSpriteInstance(SPRITE_LIBRARY[0]);

const createWorkspaceBlock = (item) => ({
  id: `${Date.now()}-${Math.random()}`,
  type: item.type,
  action: item.action,
  value: cloneBlockValue(item.value),
  ...(isEventTriggerAction(item.action) || isControlContainerAction(item.action) ? { children: [] } : {}),
  ...(item.action === actionTypes.IF_THEN_ELSE ? { elseChildren: [] } : {}),
});

const getOperatorSlotBlock = (slotValue) => {
  if (slotValue && typeof slotValue === 'object' && slotValue.type === OPERATORS) {
    return slotValue;
  }

  return null;
};

const mapOperatorSlotBlocks = (value, mapper) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([slotName, slotValue]) => {
      const slotBlock = getOperatorSlotBlock(slotValue);
      return [slotName, slotBlock ? mapper(slotBlock, slotName) : slotValue];
    })
  );
};

const findBlockById = (blocksToSearch, blockId) => {
  for (const block of blocksToSearch) {
    if (block.id === blockId) {
      return block;
    }

    const childBlock = findBlockById(block.children || [], blockId);
    if (childBlock) {
      return childBlock;
    }

    const elseChildBlock = findBlockById(block.elseChildren || [], blockId);
    if (elseChildBlock) {
      return elseChildBlock;
    }

    const operatorSlotBlocks = Object.values(block.value || {})
      .map(getOperatorSlotBlock)
      .filter(Boolean);
    const operatorSlotBlock = findBlockById(operatorSlotBlocks, blockId);
    if (operatorSlotBlock) {
      return operatorSlotBlock;
    }
  }

  return null;
};

const blockContainsId = (block, blockId) => {
  if (!block) {
    return false;
  }

  if ((block.children || []).some((childBlock) => childBlock.id === blockId || blockContainsId(childBlock, blockId))) {
    return true;
  }

  if ((block.elseChildren || []).some((childBlock) => childBlock.id === blockId || blockContainsId(childBlock, blockId))) {
    return true;
  }

  return Object.values(block.value || {})
    .map(getOperatorSlotBlock)
    .filter(Boolean)
    .some((slotBlock) => slotBlock.id === blockId || blockContainsId(slotBlock, blockId));
};

const removeBlockById = (blocksToUpdate, blockId) => (
  blocksToUpdate
    .filter((block) => block.id !== blockId)
    .map((block) => ({
      ...block,
      children: block.children ? removeBlockById(block.children, blockId) : block.children,
      elseChildren: block.elseChildren ? removeBlockById(block.elseChildren, blockId) : block.elseChildren,
      value: mapOperatorSlotBlocks(block.value, (slotBlock) => (
        slotBlock.id === blockId ? '' : {
          ...slotBlock,
          value: mapOperatorSlotBlocks(slotBlock.value, (nestedSlotBlock) => (
            removeBlockById([nestedSlotBlock], blockId)[0] || ''
          )),
        }
      )),
    }))
);

const appendChildBlock = (blocksToUpdate, parentId, childBlock, branchName = 'children') => (
  blocksToUpdate.map((block) => {
    if (block.id === parentId) {
      return {
        ...block,
        [branchName]: [...(block[branchName] || []), childBlock],
      };
    }

    if (block.children) {
      return {
        ...block,
        children: appendChildBlock(block.children, parentId, childBlock, branchName),
        elseChildren: block.elseChildren ? appendChildBlock(block.elseChildren, parentId, childBlock, branchName) : block.elseChildren,
      };
    }

    return block;
  })
);

const updateBlockValueById = (blocksToUpdate, blockId, value) => (
  blocksToUpdate.map((block) => {
    if (block.id === blockId) {
      return { ...block, value };
    }

    if (block.children) {
      return {
        ...block,
        children: updateBlockValueById(block.children, blockId, value),
        elseChildren: block.elseChildren ? updateBlockValueById(block.elseChildren, blockId, value) : block.elseChildren,
      };
    }

    return {
      ...block,
      value: mapOperatorSlotBlocks(block.value, (slotBlock) => (
        updateBlockValueById([slotBlock], blockId, value)[0]
      )),
    };
  })
);

const updateOperatorSlotById = (blocksToUpdate, blockId, slotName, slotValue) => (
  blocksToUpdate.map((block) => {
    if (block.id === blockId) {
      return {
        ...block,
        value: {
          ...block.value,
          [slotName]: slotValue,
        },
      };
    }

    return {
      ...block,
      children: block.children ? updateOperatorSlotById(block.children, blockId, slotName, slotValue) : block.children,
      elseChildren: block.elseChildren ? updateOperatorSlotById(block.elseChildren, blockId, slotName, slotValue) : block.elseChildren,
      value: mapOperatorSlotBlocks(block.value, (slotBlock) => (
        updateOperatorSlotById([slotBlock], blockId, slotName, slotValue)[0]
      )),
    };
  })
);

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const BLOCK_STEP_DELAY_MS = 1000;
const ROOT_SVG_STYLE = 'width:100%;height:100%;display:block;';
const normalizeSvgMarkup = (markup) => {
  if (!markup || !/<svg[\s>]/i.test(markup)) {
    return markup;
  }

  return markup.replace(/<svg\b([^>]*)>/i, (fullMatch, attributes = '') => {
    const styleMatch = attributes.match(/\sstyle=(['"])(.*?)\1/i);

    if (styleMatch) {
      const quote = styleMatch[1];
      const existingStyle = styleMatch[2];
      const normalizedExistingStyle = existingStyle.trim().endsWith(';') || existingStyle.trim() === ''
        ? existingStyle.trim()
        : `${existingStyle.trim()};`;
      const mergedStyle = normalizedExistingStyle.includes(ROOT_SVG_STYLE)
        ? normalizedExistingStyle
        : `${normalizedExistingStyle}${ROOT_SVG_STYLE}`;

      return `<svg${attributes.replace(styleMatch[0], ` style=${quote}${mergedStyle}${quote}`)}>`;
    }

    return `<svg${attributes} style="${ROOT_SVG_STYLE}">`;
  });
};

const loadSvgMarkup = async (src) => {
  if (!src) {
    return '';
  }

  const response = await fetch(src);

  if (!response.ok) {
    throw new Error(`Unable to load sprite asset: ${src}`);
  }

  const markup = await response.text();
  return normalizeSvgMarkup(markup);
};

const toNumber = (value) => {
  const parsedValue = typeof value === 'number' ? value : parseFloat(value);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};
const toTruthiness = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value.trim().length > 0;
  }
  return Boolean(value);
};

const removeVariableReporterBlocks = (blocksToUpdate, entityType, entityName) => (
  blocksToUpdate
    .filter((block) => {
      if (entityType === 'variable') {
        return !(block.type === VARIABLES && block.action === actionTypes.VARIABLE_REPORTER && block.value?.name === entityName);
      }

      return !(block.type === VARIABLES && block.action === actionTypes.LIST_REPORTER && block.value?.name === entityName);
    })
    .map((block) => ({
      ...block,
      children: block.children ? removeVariableReporterBlocks(block.children, entityType, entityName) : block.children,
      elseChildren: block.elseChildren ? removeVariableReporterBlocks(block.elseChildren, entityType, entityName) : block.elseChildren,
      value: mapOperatorSlotBlocks(block.value, (slotBlock) => (
        removeVariableReporterBlocks([slotBlock], entityType, entityName)[0] || ''
      )),
    }))
);

const VisualCodeEditor = () => {
  const [toastMessage, setToastMessage] = useState('');
  const spriteRef = useRef(null);
  const previewRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const spriteDragRef = useRef({ isDragging: false, hasMoved: false, offsetX: 0, offsetY: 0 });
  const backdropFileInputRef = useRef(null);
  const projectFileInputRef = useRef(null);
  const pendingBackdropChangeRef = useRef(null);
  const sessionBackdropsRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const activeAudiosRef = useRef([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isRecordingSound, setIsRecordingSound] = useState(false);
  const [backdropValue, setBackdropValue] = useState(BACKDROP_LIBRARY[0].id);
  const [sounds, setSounds] = useState(DEFAULT_SOUNDS);
  const [soundVolume, setSoundVolume] = useState(100);
  const [backdropLibrary, setBackdropLibrary] = useState(BACKDROP_LIBRARY);
  const [sessionBackdrops, setSessionBackdrops] = useState(() => [BACKDROP_LIBRARY[0]]);
  const [recordingModalState, setRecordingModalState] = useState('closed');
  const [pendingRecordedSound, setPendingRecordedSound] = useState(null);
  const [selectedReplayBlockId, setSelectedReplayBlockId] = useState('');
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [variableModalType, setVariableModalType] = useState('variable');
  const [pendingVariableName, setPendingVariableName] = useState('');
  const [variableNames, setVariableNames] = useState([]);
  const [listNames, setListNames] = useState([]);
  const [variableValues, setVariableValues] = useState({});
  const [listValues, setListValues] = useState({});
  const [activeSidebarTab, setActiveSidebarTab] = useState('blocks');
  const [spriteLibrary, setSpriteLibrary] = useState(SPRITE_LIBRARY);
  const [sprites, setSprites] = useState(() => [INITIAL_SPRITE]);
  const [selectedSpriteId, setSelectedSpriteId] = useState(INITIAL_SPRITE.id);
  const [isProjectSaving, setIsProjectSaving] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isAssetsMenuOpen, setIsAssetsMenuOpen] = useState(false);
  const [isSpriteLibraryOpen, setIsSpriteLibraryOpen] = useState(false);
  const [isBackdropLibraryOpen, setIsBackdropLibraryOpen] = useState(false);
  const [spriteLibrarySearch, setSpriteLibrarySearch] = useState('');
  const [spriteLibraryFilter, setSpriteLibraryFilter] = useState('all');
  const [backdropLibrarySearch, setBackdropLibrarySearch] = useState('');
  const [backdropLibraryFilter, setBackdropLibraryFilter] = useState('all');
  const [spriteEditorMarkup, setSpriteEditorMarkup] = useState('');
  const [spriteEditorError, setSpriteEditorError] = useState('');
  const fileMenuRef = useRef(null);
  const assetsMenuRef = useRef(null);
  const spritesRef = useRef([INITIAL_SPRITE]);
  const triggerBroadcastListenersRef = useRef(() => {});
  const previousBackdropValueRef = useRef(backdropValue);
  const [sidebarBlocks, setSidebarBlocks] = useState([
    { id: 'sidebar-move-x', type: MOTION, action: actionTypes.MOVE_X, value: 10 },
    { id: 'sidebar-move-y', type: MOTION, action: actionTypes.MOVE_Y, value: 10 },
    { id: 'sidebar-turn-right', type: MOTION, action: actionTypes.TURN_RIGHT, value: 15 },
    { id: 'sidebar-turn-left', type: MOTION, action: actionTypes.TURN_LEFT, value: 15 },
    { id: 'sidebar-goto', type: MOTION, action: actionTypes.GOTO, value: [0, 0] },
    { id: 'sidebar-goto-random', type: MOTION, action: actionTypes.GOTO_RANDOM, value: null },
    { id: 'sidebar-point-in-direction', type: MOTION, action: actionTypes.POINT_IN_DIRECTION, value: 90 },
    { id: 'sidebar-point-towards-random', type: MOTION, action: actionTypes.POINT_TOWARDS_RANDOM, value: null },
    { id: 'sidebar-say', type: LOOKS, action: actionTypes.SAY, value: 'Hello!' },
    { id: 'sidebar-think', type: LOOKS, action: actionTypes.THINK, value: 'Hmm...' },
    { id: 'sidebar-say-timer', type: LOOKS, action: actionTypes.SAY_TIMER, value: { message: 'Hello!', duration: 2 } },
    { id: 'sidebar-think-timer', type: LOOKS, action: actionTypes.THINK_TIMER, value: { message: 'Hmm...', duration: 2 } },
    { id: 'sidebar-change-size-to', type: LOOKS, action: actionTypes.CHANGE_SIZE_TO, value: 100 },
    { id: 'sidebar-change-size-by', type: LOOKS, action: actionTypes.CHANGE_SIZE_BY, value: 10 },
    { id: 'sidebar-change-color', type: LOOKS, action: actionTypes.CHANGE_COLOR, value: '#FFAB19' },
    { id: 'sidebar-change-backdrop', type: LOOKS, action: actionTypes.CHANGE_BACKDROP, value: BACKDROP_LIBRARY[0].id },
    { id: 'sidebar-hide', type: LOOKS, action: actionTypes.HIDE, value: null },
    { id: 'sidebar-show', type: LOOKS, action: actionTypes.SHOW, value: null },
    { id: 'sidebar-play-sound', type: SOUND, action: actionTypes.PLAY_SOUND, value: 'meow' },
    { id: 'sidebar-set-volume', type: SOUND, action: actionTypes.SET_VOLUME, value: 100 },
    { id: 'sidebar-change-volume-by', type: SOUND, action: actionTypes.CHANGE_VOLUME_BY, value: 10 },
    { id: 'sidebar-clear-all-sounds', type: SOUND, action: actionTypes.CLEAR_ALL_SOUNDS, value: null },
    { id: 'sidebar-when-key-pressed', type: EVENTS, action: actionTypes.WHEN_KEY_PRESSED, value: 'Space' },
    { id: 'sidebar-when-sprite-clicked', type: EVENTS, action: actionTypes.WHEN_SPRITE_CLICKED, value: null },
    { id: 'sidebar-when-backdrop-switches-to', type: EVENTS, action: actionTypes.WHEN_BACKDROP_SWITCHES_TO, value: BACKDROP_LIBRARY[0].id },
    { id: 'sidebar-when-loudness-greater-than', type: EVENTS, action: actionTypes.WHEN_LOUDNESS_GREATER_THAN, value: 10 },
    { id: 'sidebar-when-i-receive', type: EVENTS, action: actionTypes.WHEN_I_RECEIVE, value: 'Hello!' },
    { id: 'sidebar-broadcast-message-for', type: EVENTS, action: actionTypes.BROADCAST_MESSAGE_FOR, value: 'Hello!' },
    { id: 'sidebar-wait-seconds', type: CONTROLS, action: actionTypes.WAIT_SECONDS, value: 1 },
    { id: 'sidebar-repeat-times', type: CONTROLS, action: actionTypes.REPEAT_TIMES, value: { times: 10 } },
    { id: 'sidebar-forever', type: CONTROLS, action: actionTypes.FOREVER, value: null },
    { id: 'sidebar-if-then', type: CONTROLS, action: actionTypes.IF_THEN, value: { condition: '' } },
    { id: 'sidebar-if-then-else', type: CONTROLS, action: actionTypes.IF_THEN_ELSE, value: { condition: '' } },
    { id: 'sidebar-wait-until', type: CONTROLS, action: actionTypes.WAIT_UNTIL, value: { condition: '' } },
    { id: 'sidebar-repeat-until', type: CONTROLS, action: actionTypes.REPEAT_UNTIL, value: { condition: '' } },
    { id: 'sidebar-operator-add', type: OPERATORS, action: actionTypes.OPERATOR_ADD, value: { left: '', right: '' } },
    { id: 'sidebar-operator-subtract', type: OPERATORS, action: actionTypes.OPERATOR_SUBTRACT, value: { left: '', right: '' } },
    { id: 'sidebar-operator-multiply', type: OPERATORS, action: actionTypes.OPERATOR_MULTIPLY, value: { left: '', right: '' } },
    { id: 'sidebar-operator-divide', type: OPERATORS, action: actionTypes.OPERATOR_DIVIDE, value: { left: '', right: '' } },
    { id: 'sidebar-operator-modulo', type: OPERATORS, action: actionTypes.OPERATOR_MODULO, value: { left: '', right: '' } },
    { id: 'sidebar-operator-less-than', type: OPERATORS, action: actionTypes.OPERATOR_LESS_THAN, value: { left: '', right: '' } },
    { id: 'sidebar-operator-equals', type: OPERATORS, action: actionTypes.OPERATOR_EQUALS, value: { left: '', right: '' } },
    { id: 'sidebar-operator-greater-than', type: OPERATORS, action: actionTypes.OPERATOR_GREATER_THAN, value: { left: '', right: '' } },
    { id: 'sidebar-operator-and', type: OPERATORS, action: actionTypes.OPERATOR_AND, value: { left: '', right: '' } },
    { id: 'sidebar-operator-or', type: OPERATORS, action: actionTypes.OPERATOR_OR, value: { left: '', right: '' } },
    { id: 'sidebar-operator-not', type: OPERATORS, action: actionTypes.OPERATOR_NOT, value: { operand: '' } },
    { id: 'sidebar-operator-join', type: OPERATORS, action: actionTypes.OPERATOR_JOIN, value: { left: '', right: '' } },
    { id: 'sidebar-operator-letter-of', type: OPERATORS, action: actionTypes.OPERATOR_LETTER_OF, value: { index: '', source: '' } },
    { id: 'sidebar-operator-length-of', type: OPERATORS, action: actionTypes.OPERATOR_LENGTH_OF, value: { source: '' } },
    { id: 'sidebar-operator-contains', type: OPERATORS, action: actionTypes.OPERATOR_CONTAINS, value: { source: '', target: '' } },
    { id: 'sidebar-operator-math-function', type: OPERATORS, action: actionTypes.OPERATOR_MATH_FUNCTION, value: { fn: 'abs', operand: '' } },
    { id: 'sidebar-operator-pick-random', type: OPERATORS, action: actionTypes.OPERATOR_PICK_RANDOM, value: { left: '', right: '' } },
    { id: 'sidebar-set-variable-to', type: VARIABLES, action: actionTypes.SET_VARIABLE_TO, value: { variableName: '', input: '' } },
    { id: 'sidebar-change-variable-by', type: VARIABLES, action: actionTypes.CHANGE_VARIABLE_BY, value: { variableName: '', amount: 1 } },
    { id: 'sidebar-add-to-list', type: VARIABLES, action: actionTypes.ADD_TO_LIST, value: { item: '', listName: '' } },
    { id: 'sidebar-delete-from-list', type: VARIABLES, action: actionTypes.DELETE_FROM_LIST, value: { index: 1, listName: '' } },
    { id: 'sidebar-delete-all-of-list', type: VARIABLES, action: actionTypes.DELETE_ALL_OF_LIST, value: { listName: '' } },
    { id: 'sidebar-insert-at-list', type: VARIABLES, action: actionTypes.INSERT_AT_LIST, value: { item: '', index: 1, listName: '' } },
    { id: 'sidebar-replace-item-in-list', type: VARIABLES, action: actionTypes.REPLACE_ITEM_IN_LIST, value: { index: 1, item: '', listName: '' } },
  ]);

  const executeAction = useExecuteAction();
  const availableBackdrops = sessionBackdrops;
  const activeSpriteId = selectedSpriteId || sprites[0]?.id || '';
  const selectedSprite = sprites.find((sprite) => sprite.id === activeSpriteId) || sprites[0] || null;
  const blocks = selectedSprite?.blocks || EMPTY_BLOCKS;
  const spriteState = selectedSprite?.spriteState || { x: 0, y: 0, rotation: -90, size: 100 };
  const selectedBackdrop = availableBackdrops.find(({ id }) => id === String(backdropValue)) || availableBackdrops[0];
  const replayableBlocks = blocks.filter((block) => !isEventTriggerAction(block.action));
  const selectedReplayBlock = replayableBlocks.find((block) => block.id === selectedReplayBlockId) || replayableBlocks[0] || null;
  const filteredSpriteLibrary = spriteLibrary.filter((librarySprite) => {
    const matchesSearch = librarySprite.name.toLowerCase().includes(spriteLibrarySearch.trim().toLowerCase());
    const isAdded = sprites.some((sprite) => (
      sprite.libraryId === librarySprite.id
      || String(sprite.src || '') === String(librarySprite.src || '')
    ));

    if (spriteLibraryFilter === 'added') {
      return matchesSearch && isAdded;
    }

    if (spriteLibraryFilter === 'not-added') {
      return matchesSearch && !isAdded;
    }

    return matchesSearch;
  });
  const filteredBackdropLibrary = backdropLibrary.filter((libraryBackdrop) => {
    const matchesSearch = libraryBackdrop.name.toLowerCase().includes(backdropLibrarySearch.trim().toLowerCase());
    const isAdded = availableBackdrops.some((backdrop) => String(backdrop.id) === String(libraryBackdrop.id));

    if (backdropLibraryFilter === 'added') {
      return matchesSearch && isAdded;
    }

    if (backdropLibraryFilter === 'not-added') {
      return matchesSearch && !isAdded;
    }

    return matchesSearch;
  });

  const showToast = useCallback((message) => {
    setToastMessage(message);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
      toastTimeoutRef.current = null;
    }, 2500);
  }, []);

  const updateSpriteById = useCallback((spriteId, updater) => {
    setSprites((prevSprites) => prevSprites.map((sprite) => (
      sprite.id === spriteId ? updater(sprite) : sprite
    )));
  }, []);

  const updateSelectedSprite = useCallback((updater) => {
    const spriteId = selectedSpriteId || sprites[0]?.id;
    if (!spriteId) {
      return;
    }

    updateSpriteById(spriteId, updater);
  }, [selectedSpriteId, sprites, updateSpriteById]);

  const setSelectedSpriteState = useCallback((nextState) => {
    updateSelectedSprite((sprite) => ({
      ...sprite,
      spriteState: typeof nextState === 'function' ? nextState(sprite.spriteState) : nextState,
    }));
  }, [updateSelectedSprite]);

  const setSpriteSpeechBubble = useCallback((spriteId, nextBubble) => {
    updateSpriteById(spriteId, (sprite) => ({
      ...sprite,
      speechBubble: typeof nextBubble === 'function' ? nextBubble(sprite.speechBubble) : nextBubble,
    }));
  }, [updateSpriteById]);

  const updateSelectedSpriteBlocks = useCallback((updater) => {
    updateSelectedSprite((sprite) => ({
      ...sprite,
      blocks: updater(sprite.blocks || []),
    }));
  }, [updateSelectedSprite]);

  const clearAllSpriteSpeechBubbles = useCallback(() => {
    setSprites((prevSprites) => prevSprites.map((sprite) => ({
      ...sprite,
      speechBubble: { message: '', isThinking: false },
    })));
  }, []);

  useEffect(() => {
    spritesRef.current = sprites;
  }, [sprites]);

  useEffect(() => {
    if (!isFileMenuOpen && !isAssetsMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (fileMenuRef.current?.contains(event.target) || assetsMenuRef.current?.contains(event.target)) {
        return;
      }

      setIsFileMenuOpen(false);
      setIsAssetsMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsFileMenuOpen(false);
        setIsAssetsMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAssetsMenuOpen, isFileMenuOpen]);

  useEffect(() => {
    let isCancelled = false;

    void fetch('/data/sprites.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load sprite library.');
        }

        return response.json();
      })
      .then((librarySprites) => {
        if (!isCancelled && Array.isArray(librarySprites) && librarySprites.length > 0) {
          setSpriteLibrary(librarySprites);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSpriteLibrary(SPRITE_LIBRARY);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    void fetch('/data/backdrops.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load backdrop library.');
        }

        return response.json();
      })
      .then((libraryBackdrops) => {
        if (!isCancelled && Array.isArray(libraryBackdrops) && libraryBackdrops.length > 0) {
          setBackdropLibrary(libraryBackdrops);
          setSessionBackdrops((prevBackdrops) => {
            const hasOnlyFallbackBackdrop = prevBackdrops.length === 1 && String(prevBackdrops[0]?.id) === String(BACKDROP_LIBRARY[0].id);
            return hasOnlyFallbackBackdrop ? [libraryBackdrops[0]] : prevBackdrops;
          });
          setBackdropValue((prevBackdropValue) => (
            prevBackdropValue === BACKDROP_LIBRARY[0].id && libraryBackdrops[0]?.id
              ? String(libraryBackdrops[0].id)
              : prevBackdropValue
          ));
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setBackdropLibrary(BACKDROP_LIBRARY);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedSpriteId && sprites.some((sprite) => sprite.id === selectedSpriteId)) {
      return;
    }

    setSelectedSpriteId(sprites[0]?.id || '');
  }, [selectedSpriteId, sprites]);

  useEffect(() => {
    let isCancelled = false;

    if (!selectedSprite) {
      setSpriteEditorMarkup('');
      setSpriteEditorError('');
      return undefined;
    }

    if (selectedSprite.svgMarkup) {
      setSpriteEditorMarkup(selectedSprite.svgMarkup);
      setSpriteEditorError('');
      return undefined;
    }

    void loadSvgMarkup(selectedSprite.src)
      .then((markup) => {
        if (!isCancelled) {
          setSpriteEditorMarkup(markup);
          setSpriteEditorError('');
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSpriteEditorMarkup('');
          setSpriteEditorError('Unable to load SVG source for this sprite.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedSprite]);

  const getProjectState = useCallback(() => ({
    sprites,
    sidebarBlocks,
    variableNames,
    listNames,
    variableValues,
    listValues,
    backdropValue,
    sessionBackdrops,
    sounds,
    soundVolume,
    selectedSpriteId,
  }), [
    backdropValue,
    listNames,
    listValues,
    selectedSpriteId,
    sidebarBlocks,
    soundVolume,
    sounds,
    sprites,
    sessionBackdrops,
    variableNames,
    variableValues,
  ]);

  const applyProjectState = useCallback((state = {}) => {
    const nextSprites = Array.isArray(state.sprites) && state.sprites.length > 0
      ? state.sprites.map((sprite) => ({
        ...sprite,
        src: sprite.src || SPRITE_LIBRARY.find((librarySprite) => librarySprite.id === sprite.libraryId)?.src || SPRITE_LIBRARY[0].src,
        color: sprite.color || SPRITE_LIBRARY[0].color,
        svgMarkup: sprite.svgMarkup || null,
        spriteState: {
          x: sprite.spriteState?.x ?? 0,
          y: sprite.spriteState?.y ?? 0,
          rotation: sprite.spriteState?.rotation ?? -90,
          size: sprite.spriteState?.size ?? 100,
          visible: sprite.spriteState?.visible ?? true,
        },
        speechBubble: sprite.speechBubble || { message: '', isThinking: false },
        blocks: Array.isArray(sprite.blocks) ? sprite.blocks : [],
      }))
      : [
        {
          ...createSpriteInstance(SPRITE_LIBRARY[0]),
          blocks: Array.isArray(state.blocks) ? state.blocks : [],
          spriteState: {
            x: state.spriteState?.x ?? 0,
            y: state.spriteState?.y ?? 0,
            rotation: state.spriteState?.rotation ?? -90,
            size: state.spriteState?.size ?? 100,
            visible: state.spriteState?.visible ?? true,
          },
          color: state.spriteColor || SPRITE_LIBRARY[0].color,
          svgMarkup: state.svgMarkup || null,
        },
      ];

    setSprites(nextSprites);
    setSidebarBlocks(Array.isArray(state.sidebarBlocks) ? state.sidebarBlocks : []);
    setVariableNames(Array.isArray(state.variableNames) ? state.variableNames : []);
    setListNames(Array.isArray(state.listNames) ? state.listNames : []);
    setVariableValues(state.variableValues && typeof state.variableValues === 'object' ? state.variableValues : {});
    setListValues(state.listValues && typeof state.listValues === 'object' ? state.listValues : {});
    const nextSessionBackdrops = Array.isArray(state.sessionBackdrops) && state.sessionBackdrops.length > 0
      ? state.sessionBackdrops
      : [BACKDROP_LIBRARY[0], ...(Array.isArray(state.uploadedBackdrops) ? state.uploadedBackdrops : [])];
    setSessionBackdrops(nextSessionBackdrops);
    setBackdropValue(
      nextSessionBackdrops.some((backdrop) => String(backdrop.id) === String(state.backdropValue ?? '0'))
        ? String(state.backdropValue ?? '0')
        : String(nextSessionBackdrops[0]?.id ?? '0')
    );
    setSounds(Array.isArray(state.sounds) ? state.sounds : DEFAULT_SOUNDS);
    setSoundVolume(state.soundVolume ?? 100);
    setSelectedSpriteId(state.selectedSpriteId || nextSprites[0]?.id || '');
  }, []);

  const handleSaveProject = useCallback(async () => {
    setIsProjectSaving(true);

    try {
      const projectFile = {
        format: 'visual-code-editor-project',
        version: 1,
        savedAt: new Date().toISOString(),
        state: getProjectState(),
      };
      const fileContents = JSON.stringify(projectFile, null, 2);
      const filename = 'visual-code-project.json';

      if (window.showSaveFilePicker) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Visual Code Editor Project',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(fileContents);
        await writable.close();
      } else {
        const blob = new Blob([fileContents], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      showToast('Project file saved.');
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToast(error.message || 'Unable to save project file.');
      }
    } finally {
      setIsProjectSaving(false);
    }
  }, [getProjectState, showToast]);

  const loadProjectFile = useCallback(async (file) => {
    if (!file) return;

    setIsProjectLoading(true);

    try {
      const fileContents = await file.text();
      const projectFile = JSON.parse(fileContents);

      if (projectFile.format !== 'visual-code-editor-project' || !projectFile.state) {
        throw new Error('Choose a valid Visual Code Editor project file.');
      }

      applyProjectState(projectFile.state);
      showToast('Project file loaded.');
    } catch (error) {
      showToast(error.message || 'Unable to load project file.');
    } finally {
      setIsProjectLoading(false);
    }
  }, [applyProjectState, showToast]);

  const handleLoadProject = useCallback(() => {
    projectFileInputRef.current?.click();
  }, []);

  const handleProjectFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    void loadProjectFile(file);
  }, [loadProjectFile]);

  const handleAddSprite = useCallback((librarySprite) => {
    const nextSprite = createSpriteInstance(librarySprite);
    setSprites((prevSprites) => [...prevSprites, nextSprite]);
    setSelectedSpriteId(nextSprite.id);
    setActiveSidebarTab('sprite');
    setIsSpriteLibraryOpen(false);
    showToast(`${librarySprite.name} added.`);
  }, [showToast]);

  const handleRemoveSprite = useCallback((spriteId) => {
    setSprites((prevSprites) => {
      if (prevSprites.length <= 1) {
        showToast('Keep at least one sprite in the project.');
        return prevSprites;
      }

      return prevSprites.filter((sprite) => sprite.id !== spriteId);
    });
  }, [showToast]);

  const handleSelectBackdrop = useCallback((nextBackdropId) => {
    setBackdropValue(String(nextBackdropId));
    setActiveSidebarTab('backdrops');
    showToast('Initial backdrop updated.');
  }, [showToast]);

  const handleAddBackdropToSession = useCallback((libraryBackdrop) => {
    setSessionBackdrops((prevBackdrops) => {
      if (prevBackdrops.some((backdrop) => String(backdrop.id) === String(libraryBackdrop.id))) {
        return prevBackdrops;
      }

      return [...prevBackdrops, libraryBackdrop];
    });
    showToast(`${libraryBackdrop.name} added to session backdrops.`);
  }, [showToast]);

  const handleApplySpriteMarkup = useCallback((nextMarkup = spriteEditorMarkup) => {
    if (!selectedSprite) {
      return;
    }

    const trimmedMarkup = nextMarkup.trim();

    if (!trimmedMarkup || !/<svg[\s>]/i.test(trimmedMarkup)) {
      setSpriteEditorError('Enter valid SVG markup to update the sprite.');
      return;
    }

    const normalizedMarkup = normalizeSvgMarkup(trimmedMarkup);
    updateSpriteById(selectedSprite.id, (sprite) => ({
      ...sprite,
      svgMarkup: normalizedMarkup,
    }));
    setSpriteEditorMarkup(normalizedMarkup);
    setSpriteEditorError('');
    showToast(`${selectedSprite.name} sprite updated.`);
  }, [selectedSprite, showToast, spriteEditorMarkup, updateSpriteById]);

  const handleResetSpriteMarkup = useCallback(() => {
    if (!selectedSprite) {
      return;
    }

    void loadSvgMarkup(selectedSprite.src)
      .then((markup) => {
        updateSpriteById(selectedSprite.id, (sprite) => ({
          ...sprite,
          svgMarkup: null,
        }));
        setSpriteEditorMarkup(markup);
        setSpriteEditorError('');
        showToast(`${selectedSprite.name} sprite reset.`);
      })
      .catch(() => {
        setSpriteEditorError('Unable to reload the original SVG source.');
      });
  }, [selectedSprite, showToast, updateSpriteById]);

  const handleSelectedSpriteSizeChange = useCallback((nextSize) => {
    if (!selectedSprite) {
      return;
    }

    const normalizedSize = Math.max(10, Math.min(300, Number(nextSize) || 100));
    updateSpriteById(selectedSprite.id, (sprite) => ({
      ...sprite,
      spriteState: {
        ...sprite.spriteState,
        size: normalizedSize,
      },
    }));
  }, [selectedSprite, updateSpriteById]);

  useEffect(() => {
    if (selectedReplayBlockId && replayableBlocks.some((block) => block.id === selectedReplayBlockId)) {
      return;
    }

    setSelectedReplayBlockId(replayableBlocks[0]?.id || '');
  }, [replayableBlocks, selectedReplayBlockId]);

  const handleSidebarBlockChange = useCallback((id, action, value) => {
    setSidebarBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id ? { ...block, value } : block
      )
    );
  }, []);

  useEffect(() => {
    setSidebarBlocks((prevBlocks) => prevBlocks.map((block) => {
      if (block.type !== VARIABLES || isVariableReporterAction(block.action)) {
        return block;
      }

      if (block.action === actionTypes.SET_VARIABLE_TO || block.action === actionTypes.CHANGE_VARIABLE_BY) {
        const nextVariableName = variableNames.includes(block.value.variableName) ? block.value.variableName : (variableNames[0] || '');
        return {
          ...block,
          value: {
            ...block.value,
            variableName: nextVariableName,
          },
        };
      }

      const nextListName = listNames.includes(block.value.listName) ? block.value.listName : (listNames[0] || '');
      return {
        ...block,
        value: {
          ...block.value,
          listName: nextListName,
        },
      };
    }));
  }, [listNames, variableNames]);

  const handleDrop = useCallback((item) => {
    if (item.isWorkspaceBlock) {
      if (item.parentId) {
        updateSelectedSpriteBlocks((prevBlocks) => {
          const existingBlock = findBlockById(prevBlocks, item.id);

          if (!existingBlock) {
            return prevBlocks;
          }

          return [...removeBlockById(prevBlocks, item.id), existingBlock];
        });
      }

      return;
    }

    const newBlock = createWorkspaceBlock(item);
    updateSelectedSpriteBlocks((prevBlocks) => [...prevBlocks, newBlock]);
    setSelectedReplayBlockId((currentId) => currentId || newBlock.id);
  }, [updateSelectedSpriteBlocks]);

  const moveBlock = useCallback((fromIndex, toIndex) => {
    updateSelectedSpriteBlocks((prevBlocks) => {
      const nextBlocks = [...prevBlocks];
      const [movedBlock] = nextBlocks.splice(fromIndex, 1);

      if (!movedBlock) {
        return prevBlocks;
      }

      nextBlocks.splice(toIndex, 0, movedBlock);
      return nextBlocks;
    });
  }, [updateSelectedSpriteBlocks]);

  const handleBlockChange = useCallback((id, action, value) => {
    updateSelectedSpriteBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === id ? { ...block, value } : block
      )
    );
  }, [updateSelectedSpriteBlocks]);

  const handleNestedBlockChange = useCallback((id, action, value) => {
    updateSelectedSpriteBlocks((prevBlocks) => updateBlockValueById(prevBlocks, id, value));
  }, [updateSelectedSpriteBlocks]);

  const handleRemoveBlock = useCallback((id) => {
    updateSelectedSpriteBlocks((prevBlocks) => removeBlockById(prevBlocks, id));
    setSelectedReplayBlockId((currentId) => (currentId === id ? '' : currentId));
  }, [updateSelectedSpriteBlocks]);

  const handleNestedDrop = useCallback((parentId, item, branchName = 'children') => {
    if (item.id === parentId || isEventTriggerAction(item.action) || isOperatorAction(item.action)) {
      return;
    }

    updateSelectedSpriteBlocks((prevBlocks) => {
      const existingBlock = item.isWorkspaceBlock ? findBlockById(prevBlocks, item.id) : null;
      const childBlock = existingBlock
        ? { ...existingBlock, id: `${Date.now()}-${Math.random()}` }
        : createWorkspaceBlock(item);

      const blocksWithoutMovedBlock = item.isWorkspaceBlock
        ? removeBlockById(prevBlocks, item.id)
        : prevBlocks;

      return appendChildBlock(blocksWithoutMovedBlock, parentId, childBlock, branchName);
    });
  }, [updateSelectedSpriteBlocks]);

  const handleOperatorSlotChange = useCallback((id, slotName, slotValue) => {
    updateSelectedSpriteBlocks((prevBlocks) => updateOperatorSlotById(prevBlocks, id, slotName, slotValue));
  }, [updateSelectedSpriteBlocks]);

  const handleOperatorSlotDrop = useCallback((id, slotName, item) => {
    if (item.id === id || !isOperatorAction(item.action)) {
      return;
    }

    updateSelectedSpriteBlocks((prevBlocks) => {
      const existingBlock = item.isWorkspaceBlock ? findBlockById(prevBlocks, item.id) : null;
      if (existingBlock && blockContainsId(existingBlock, id)) {
        return prevBlocks;
      }

      const slotBlock = existingBlock
        ? { ...existingBlock, id: `${Date.now()}-${Math.random()}` }
        : createWorkspaceBlock(item);
      const blocksWithoutMovedBlock = item.isWorkspaceBlock
        ? removeBlockById(prevBlocks, item.id)
        : prevBlocks;

      return updateOperatorSlotById(blocksWithoutMovedBlock, id, slotName, slotBlock);
    });
  }, [updateSelectedSpriteBlocks]);

  const openVariableModal = useCallback(() => {
    setPendingVariableName('');
    setVariableModalType('variable');
    setIsVariableModalOpen(true);
  }, []);

  const openListModal = useCallback(() => {
    setPendingVariableName('');
    setVariableModalType('list');
    setIsVariableModalOpen(true);
  }, []);

  const closeVariableModal = useCallback(() => {
    setPendingVariableName('');
    setIsVariableModalOpen(false);
  }, []);

  const handleCreateVariable = useCallback(() => {
    const trimmedName = pendingVariableName.trim();

    if (!trimmedName) {
      showToast('Enter a variable name.');
      return;
    }

    const existingNames = variableModalType === 'variable' ? variableNames : listNames;
    const alreadyExists = existingNames.some((name) => name.toLowerCase() === trimmedName.toLowerCase());

    if (alreadyExists) {
      showToast(`A ${variableModalType} with that name already exists.`);
      return;
    }

    if (variableModalType === 'variable') {
      setVariableNames((prevNames) => [...prevNames, trimmedName]);
      setVariableValues((prevValues) => ({ ...prevValues, [trimmedName]: 0 }));
    } else {
      setListNames((prevNames) => [...prevNames, trimmedName]);
      setListValues((prevValues) => ({ ...prevValues, [trimmedName]: [] }));
    }

    setSidebarBlocks((prevBlocks) => ([
      ...prevBlocks,
      {
        id: `sidebar-${variableModalType}-${Date.now()}-${Math.random()}`,
        type: VARIABLES,
        action: variableModalType === 'variable' ? actionTypes.VARIABLE_REPORTER : actionTypes.LIST_REPORTER,
        value: { name: trimmedName },
      },
    ]));
    closeVariableModal();
  }, [closeVariableModal, listNames, pendingVariableName, showToast, variableModalType, variableNames]);

  const handleDeleteVariableEntity = useCallback((entityType, entityName) => {
    if (!entityName) {
      return;
    }

    if (entityType === 'variable') {
      setVariableNames((prevNames) => prevNames.filter((name) => name !== entityName));
      setVariableValues((prevValues) => {
        const nextValues = { ...prevValues };
        delete nextValues[entityName];
        return nextValues;
      });
    } else {
      setListNames((prevNames) => prevNames.filter((name) => name !== entityName));
      setListValues((prevValues) => {
        const nextValues = { ...prevValues };
        delete nextValues[entityName];
        return nextValues;
      });
    }

    setSidebarBlocks((prevBlocks) => prevBlocks.filter((block) => {
      if (entityType === 'variable') {
        return !(block.type === VARIABLES && block.action === actionTypes.VARIABLE_REPORTER && block.value?.name === entityName);
      }

      return !(block.type === VARIABLES && block.action === actionTypes.LIST_REPORTER && block.value?.name === entityName);
    }));

    setSprites((prevSprites) => prevSprites.map((sprite) => ({
      ...sprite,
      blocks: removeVariableReporterBlocks(sprite.blocks || [], entityType, entityName),
    })));
  }, []);

  const executeVariableAction = useCallback(async (block) => {
    switch (block.action) {
      case actionTypes.SET_VARIABLE_TO: {
        const variableName = block.value?.variableName;
        if (!variableName) return;
        setVariableValues((prevValues) => ({
          ...prevValues,
          [variableName]: block.value?.input ?? '',
        }));
        break;
      }
      case actionTypes.CHANGE_VARIABLE_BY: {
        const variableName = block.value?.variableName;
        if (!variableName) return;
        setVariableValues((prevValues) => {
          const currentValue = parseFloat(prevValues[variableName] ?? 0);
          const amount = parseFloat(block.value?.amount ?? 0);
          return {
            ...prevValues,
            [variableName]: (Number.isNaN(currentValue) ? 0 : currentValue) + (Number.isNaN(amount) ? 0 : amount),
          };
        });
        break;
      }
      case actionTypes.ADD_TO_LIST: {
        const listName = block.value?.listName;
        if (!listName) return;
        setListValues((prevValues) => ({
          ...prevValues,
          [listName]: [...(prevValues[listName] || []), block.value?.item ?? ''],
        }));
        break;
      }
      case actionTypes.DELETE_FROM_LIST: {
        const listName = block.value?.listName;
        const index = parseInt(block.value?.index, 10) - 1;
        if (!listName || Number.isNaN(index)) return;
        setListValues((prevValues) => ({
          ...prevValues,
          [listName]: (prevValues[listName] || []).filter((_, itemIndex) => itemIndex !== index),
        }));
        break;
      }
      case actionTypes.DELETE_ALL_OF_LIST: {
        const listName = block.value?.listName;
        if (!listName) return;
        setListValues((prevValues) => ({
          ...prevValues,
          [listName]: [],
        }));
        break;
      }
      case actionTypes.INSERT_AT_LIST: {
        const listName = block.value?.listName;
        const index = Math.max(0, parseInt(block.value?.index, 10) - 1);
        if (!listName || Number.isNaN(index)) return;
        setListValues((prevValues) => {
          const nextItems = [...(prevValues[listName] || [])];
          nextItems.splice(index, 0, block.value?.item ?? '');
          return {
            ...prevValues,
            [listName]: nextItems,
          };
        });
        break;
      }
      case actionTypes.REPLACE_ITEM_IN_LIST: {
        const listName = block.value?.listName;
        const index = parseInt(block.value?.index, 10) - 1;
        if (!listName || Number.isNaN(index)) return;
        setListValues((prevValues) => {
          const nextItems = [...(prevValues[listName] || [])];
          if (index < 0 || index >= nextItems.length) {
            return prevValues;
          }
          nextItems[index] = block.value?.item ?? '';
          return {
            ...prevValues,
            [listName]: nextItems,
          };
        });
        break;
      }
      default:
        break;
    }
  }, []);

  const evaluateOperatorBlock = useCallback((block) => {
    if (!block || block.type !== OPERATORS) {
      return block;
    }

    const resolveOperand = (operand) => {
      if (operand && typeof operand === 'object' && operand.type === OPERATORS) {
        return evaluateOperatorBlock(operand);
      }

      return operand;
    };

    switch (block.action) {
      case actionTypes.OPERATOR_ADD:
        return toNumber(resolveOperand(block.value?.left)) + toNumber(resolveOperand(block.value?.right));
      case actionTypes.OPERATOR_SUBTRACT:
        return toNumber(resolveOperand(block.value?.left)) - toNumber(resolveOperand(block.value?.right));
      case actionTypes.OPERATOR_MULTIPLY:
        return toNumber(resolveOperand(block.value?.left)) * toNumber(resolveOperand(block.value?.right));
      case actionTypes.OPERATOR_DIVIDE:
        return toNumber(resolveOperand(block.value?.left)) / toNumber(resolveOperand(block.value?.right));
      case actionTypes.OPERATOR_MODULO:
        return toNumber(resolveOperand(block.value?.left)) % toNumber(resolveOperand(block.value?.right));
      case actionTypes.OPERATOR_LESS_THAN:
        return resolveOperand(block.value?.left) < resolveOperand(block.value?.right);
      case actionTypes.OPERATOR_EQUALS:
        return resolveOperand(block.value?.left) === resolveOperand(block.value?.right);
      case actionTypes.OPERATOR_GREATER_THAN:
        return resolveOperand(block.value?.left) > resolveOperand(block.value?.right);
      case actionTypes.OPERATOR_AND:
        return toTruthiness(resolveOperand(block.value?.left)) && toTruthiness(resolveOperand(block.value?.right));
      case actionTypes.OPERATOR_OR:
        return toTruthiness(resolveOperand(block.value?.left)) || toTruthiness(resolveOperand(block.value?.right));
      case actionTypes.OPERATOR_NOT:
        return !toTruthiness(resolveOperand(block.value?.operand));
      case actionTypes.OPERATOR_JOIN:
        return `${resolveOperand(block.value?.left) ?? ''}${resolveOperand(block.value?.right) ?? ''}`;
      case actionTypes.OPERATOR_LETTER_OF: {
        const source = String(resolveOperand(block.value?.source) ?? '');
        const index = Math.max(0, Math.floor(toNumber(resolveOperand(block.value?.index))) - 1);
        return source[index] || '';
      }
      case actionTypes.OPERATOR_LENGTH_OF: {
        const source = resolveOperand(block.value?.source);
        if (Array.isArray(source)) return source.length;
        return String(source ?? '').length;
      }
      case actionTypes.OPERATOR_CONTAINS: {
        const source = resolveOperand(block.value?.source);
        const target = resolveOperand(block.value?.target);
        if (Array.isArray(source)) {
          return source.includes(target);
        }
        return String(source ?? '').includes(String(target ?? ''));
      }
      case actionTypes.OPERATOR_MATH_FUNCTION: {
        const operand = toNumber(resolveOperand(block.value?.operand));
        switch (block.value?.fn) {
          case 'abs': return Math.abs(operand);
          case 'floor': return Math.floor(operand);
          case 'ceiling': return Math.ceil(operand);
          case 'sqrt': return Math.sqrt(operand);
          case 'sin': return Math.sin((operand * Math.PI) / 180);
          case 'cos': return Math.cos((operand * Math.PI) / 180);
          case 'tan': return Math.tan((operand * Math.PI) / 180);
          case 'asin': return (Math.asin(operand) * 180) / Math.PI;
          case 'acos': return (Math.acos(operand) * 180) / Math.PI;
          case 'atan': return (Math.atan(operand) * 180) / Math.PI;
          case 'ln': return Math.log(operand);
          case 'log': return Math.log10(operand);
          case 'e^': return Math.exp(operand);
          case '10^': return 10 ** operand;
          default: return operand;
        }
      }
      case actionTypes.OPERATOR_PICK_RANDOM: {
        const min = Math.ceil(toNumber(resolveOperand(block.value?.left)));
        const max = Math.floor(toNumber(resolveOperand(block.value?.right)));
        if (max < min) return min;
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      default:
        return '';
    }
  }, []);

  const evaluateCondition = useCallback((conditionValue) => {
    if (conditionValue && typeof conditionValue === 'object' && conditionValue.type === OPERATORS) {
      return toTruthiness(evaluateOperatorBlock(conditionValue));
    }

    return toTruthiness(conditionValue);
  }, [evaluateOperatorBlock]);

  const executeControlAction = useCallback(async (block, runNestedBlockList) => {
    switch (block.action) {
      case actionTypes.WAIT_SECONDS:
        await pause(Math.max(0, toNumber(block.value)) * 1000);
        break;
      case actionTypes.REPEAT_TIMES: {
        const repeatCount = Math.max(0, Math.floor(toNumber(block.value?.times)));
        for (let index = 0; index < repeatCount; index += 1) {
          await runNestedBlockList(block.children || []);
        }
        break;
      }
      case actionTypes.FOREVER:
        for (let index = 0; index < 100; index += 1) {
          await runNestedBlockList(block.children || []);
        }
        break;
      case actionTypes.IF_THEN:
        if (evaluateCondition(block.value?.condition)) {
          await runNestedBlockList(block.children || []);
        }
        break;
      case actionTypes.IF_THEN_ELSE:
        if (evaluateCondition(block.value?.condition)) {
          await runNestedBlockList(block.children || []);
        } else {
          await runNestedBlockList(block.elseChildren || []);
        }
        break;
      case actionTypes.WAIT_UNTIL:
        while (!evaluateCondition(block.value?.condition)) {
          await pause(100);
        }
        break;
      case actionTypes.REPEAT_UNTIL:
        while (!evaluateCondition(block.value?.condition)) {
          await runNestedBlockList(block.children || []);
        }
        break;
      default:
        break;
    }
  }, [evaluateCondition]);

  const getPointerSpritePosition = useCallback((event) => {
    const preview = previewRef.current;
    if (!preview) return null;

    const previewRect = preview.getBoundingClientRect();

    return {
      x: event.clientX - previewRect.left - (previewRect.width / 2) - spriteDragRef.current.offsetX,
      y: event.clientY - previewRect.top - (previewRect.height / 2) - spriteDragRef.current.offsetY,
    };
  }, []);

  const handleSpritePointerDown = useCallback((event) => {
    if (isRunning || event.button > 0) return;

    const preview = previewRef.current;
    if (!preview) return;

    const previewRect = preview.getBoundingClientRect();
    spriteDragRef.current = {
      isDragging: true,
      hasMoved: false,
      offsetX: event.clientX - previewRect.left - (previewRect.width / 2) - spriteState.x,
      offsetY: event.clientY - previewRect.top - (previewRect.height / 2) - spriteState.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, [isRunning, spriteState.x, spriteState.y]);

  const handleSpritePointerMove = useCallback((event) => {
    if (!spriteDragRef.current.isDragging) return;

    const nextPosition = getPointerSpritePosition(event);
    if (!nextPosition) return;

    spriteDragRef.current.hasMoved = true;

    setSelectedSpriteState((prevState) => ({
      ...prevState,
      x: nextPosition.x,
      y: nextPosition.y,
    }));
  }, [getPointerSpritePosition, setSelectedSpriteState]);

  const handleSpritePointerUp = useCallback((event) => {
    if (!spriteDragRef.current.isDragging) return;

    spriteDragRef.current.isDragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const runBlockListForSprite = useCallback(async (spriteId, blockList) => {
    const setSpriteStateForId = (nextState) => updateSpriteById(spriteId, (sprite) => ({
      ...sprite,
      spriteState: typeof nextState === 'function' ? nextState(sprite.spriteState) : nextState,
    }));
    const setSpriteColorForId = (nextColor) => updateSpriteById(spriteId, (sprite) => ({
      ...sprite,
      color: typeof nextColor === 'function' ? nextColor(sprite.color) : nextColor,
    }));
    const setSpeechBubbleForId = (nextBubble) => setSpriteSpeechBubble(spriteId, nextBubble);

    for (const block of blockList) {
      if (isEventTriggerAction(block.action)) {
        continue;
      }

      if (block.type === OPERATORS) {
        continue;
      }

      if (block.type === VARIABLES) {
        if (isVariableReporterAction(block.action)) {
          continue;
        }
        await executeVariableAction(block);
        if (shouldApplyStepDelay(block)) {
          await pause(BLOCK_STEP_DELAY_MS);
        }
        continue;
      }

      if (block.type === CONTROLS) {
        await executeControlAction(block, (nestedBlocks) => runBlockListForSprite(spriteId, nestedBlocks));
        if (shouldApplyStepDelay(block)) {
          await pause(BLOCK_STEP_DELAY_MS);
        }
        continue;
      }

      await executeAction(
        block,
        sounds,
        soundVolume,
        activeAudiosRef,
        setSpriteStateForId,
        setSpeechBubbleForId,
        setSpriteColorForId,
        setBackdropValue,
        setSoundVolume,
        (message) => triggerBroadcastListenersRef.current(message)
      );
      if (shouldApplyStepDelay(block)) {
        await pause(BLOCK_STEP_DELAY_MS);
      }
    }
  }, [executeAction, executeControlAction, executeVariableAction, setSpriteSpeechBubble, sounds, soundVolume, updateSpriteById]);

  const runMatchingEventBlocks = useCallback((predicate, spritePredicate = () => true) => {
    const eventRuns = spritesRef.current
      .filter(spritePredicate)
      .flatMap((sprite) => (
        (sprite.blocks || [])
          .filter((block) => isEventTriggerAction(block.action) && predicate(block))
          .map((block) => runBlockListForSprite(sprite.id, block.children || []))
      ));

    return Promise.all(eventRuns);
  }, [runBlockListForSprite]);

  useEffect(() => {
    triggerBroadcastListenersRef.current = (message) => {
      const normalizedMessage = String(message || '').trim();

      if (!normalizedMessage) {
        return Promise.resolve();
      }

      return runMatchingEventBlocks((block) => (
        block.action === actionTypes.WHEN_I_RECEIVE
        && String(block.value || '').trim() === normalizedMessage
      ));
    };
  }, [runMatchingEventBlocks]);

  const runCode = useCallback(async () => {
    if (isRunning) return;
    clearAllSpriteSpeechBubbles();
    setIsRunning(true);

    try {
      await Promise.all(
        sprites.map((sprite) => runBlockListForSprite(
          sprite.id,
          (sprite.blocks || []).filter((block) => !isEventTriggerAction(block.action))
        ))
      );
    } finally {
      setIsRunning(false);
      clearAllSpriteSpeechBubbles();
    }
  }, [clearAllSpriteSpeechBubbles, isRunning, runBlockListForSprite, sprites]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      runMatchingEventBlocks((block) => (
        block.action === actionTypes.WHEN_KEY_PRESSED && block.value === event.code
      ));
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [runMatchingEventBlocks]);

  useEffect(() => {
    const previousBackdropValue = previousBackdropValueRef.current;
    previousBackdropValueRef.current = backdropValue;

    if (String(previousBackdropValue) === String(backdropValue)) {
      return;
    }

    runMatchingEventBlocks((block) => (
      block.action === actionTypes.WHEN_BACKDROP_SWITCHES_TO && String(block.value) === String(backdropValue)
    ));
  }, [backdropValue, runMatchingEventBlocks]);

  const handleSpriteClick = useCallback(() => {
    if (spriteDragRef.current.hasMoved) {
      spriteDragRef.current.hasMoved = false;
      return;
    }

    runMatchingEventBlocks(
      (block) => block.action === actionTypes.WHEN_SPRITE_CLICKED,
      (sprite) => sprite.id === activeSpriteId
    );
  }, [activeSpriteId, runMatchingEventBlocks]);

  const replaySelectedBlock = useCallback(async () => {
    if (!selectedReplayBlock) {
      showToast('Add a non-event block to replay.');
      return;
    }

    setIsRunning(true);

    try {
      await runBlockListForSprite(activeSpriteId, [selectedReplayBlock]);
      showToast(`Replayed ${describeBlock(selectedReplayBlock)}.`);
    } finally {
      setIsRunning(false);
    }
  }, [activeSpriteId, runBlockListForSprite, selectedReplayBlock, showToast]);

  const handleBackdropMenuAction = useCallback((id, action, onChange) => {
    pendingBackdropChangeRef.current = { id, action, onChange };
    backdropFileInputRef.current?.click();
  }, []);

  const handleBackdropUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Please upload an image file.');
      return;
    }

    const pendingChange = pendingBackdropChangeRef.current;
    const reader = new FileReader();

    reader.onload = () => {
      const uploadedBackdrop = {
        id: `uploaded-backdrop-${Date.now()}`,
        name: file.name || 'Uploaded image',
        type: 'uploaded',
        url: reader.result,
      };

      setSessionBackdrops((prevBackdrops) => [...prevBackdrops, uploadedBackdrop]);

      if (pendingChange) {
        pendingChange.onChange(pendingChange.id, pendingChange.action, uploadedBackdrop.id);
        pendingBackdropChangeRef.current = null;
      }
    };

    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    sessionBackdropsRef.current = sessionBackdrops.filter((backdrop) => backdrop.type === 'uploaded');
  }, [sessionBackdrops]);

  useEffect(() => {
    return () => {
      sessionBackdropsRef.current.forEach((backdrop) => {
        if (backdrop.type === 'uploaded' && String(backdrop.url).startsWith('blob:')) {
          URL.revokeObjectURL(backdrop.url);
        }
      });
    };
  }, []);

  useEffect(() => (
    () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    }
  ), []);

  useEffect(() => {
    const hasUnsavedChanges = sprites.some((sprite) => (sprite.blocks || []).length > 0) || sessionBackdrops.length > 1 || sounds.some(({ type }) => type === 'recorded');

    if (!hasUnsavedChanges) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionBackdrops.length, sounds, sprites]);

  const startSoundRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      window.alert('Sound recording is not supported in this browser.');
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
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
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
      window.alert('Microphone access is required to record a sound.');
      setRecordingModalState('closed');
    }
  }, []);

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
  }, [pendingRecordedSound]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full min-h-0 flex-col">
        <nav className="flex h-16 flex-shrink-0 items-center justify-between border-b border-sky-900/60 bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 px-5 shadow-sm">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <div ref={fileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsAssetsMenuOpen(false);
                  setIsFileMenuOpen((open) => !open);
                }}
                className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                aria-expanded={isFileMenuOpen}
                aria-haspopup="menu"
              >
                <FileText size={16} />
                File
                <ChevronDown size={14} className={`transition ${isFileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isFileMenuOpen && (
              <div className="absolute left-0 top-12 z-20 w-52 rounded-xl border border-sky-900/20 bg-white py-1.5 text-sm shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setIsFileMenuOpen(false);
                    void handleSaveProject();
                  }}
                  disabled={isProjectSaving}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50 ${isProjectSaving ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Save size={15} className="text-blue-600" />
                  Save Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFileMenuOpen(false);
                    handleLoadProject();
                  }}
                  disabled={isProjectLoading}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50 ${isProjectLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Upload size={15} className="text-blue-600" />
                  Load Project
                </button>
              </div>
              )}
            </div>
            <div ref={assetsMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsFileMenuOpen(false);
                  setIsAssetsMenuOpen((open) => !open);
                }}
                className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                aria-expanded={isAssetsMenuOpen}
                aria-haspopup="menu"
              >
                <FolderOpen size={16} />
                Assets
                <ChevronDown size={14} className={`transition ${isAssetsMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAssetsMenuOpen && (
                <div className="absolute left-0 top-12 z-20 w-56 rounded-xl border border-sky-900/20 bg-white py-1.5 text-sm shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssetsMenuOpen(false);
                      setIsSpriteLibraryOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50"
                  >
                    <Shapes size={15} className="text-orange-500" />
                    Sprite Library
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssetsMenuOpen(false);
                      setIsBackdropLibraryOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50"
                  >
                    <ImageIcon size={15} className="text-emerald-600" />
                    Backdrop Library
                  </button>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Visual Code Editor</h1>
        </nav>
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <div className="flex w-1/4 flex-col bg-gray-100 p-4">
          <div className="mb-4 overflow-x-auto pb-1">
            <div className="inline-flex min-w-max rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveSidebarTab('blocks')}
              className={`flex-shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeSidebarTab === 'blocks' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-700'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveSidebarTab('sprite')}
              className={`flex-shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeSidebarTab === 'sprite' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-700'
              }`}
            >
              Sprite
            </button>
            <button
              onClick={() => setActiveSidebarTab('backdrops')}
              className={`flex-shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeSidebarTab === 'backdrops' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-700'
              }`}
            >
              Backdrops
            </button>
            </div>
          </div>

          <div
            className="overflow-y-auto pr-1"
            style={{ height: EDITOR_PANEL_HEIGHT, minHeight: EDITOR_PANEL_HEIGHT }}
          >
          {activeSidebarTab === 'blocks' && (
            <div className="h-full rounded-xl border border-gray-200 bg-white/70 p-3 shadow-sm">
              <h2 className="text-lg font-bold mb-2">Motion</h2>
              {sidebarBlocks.filter(block => block.type === MOTION).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableVariables={variableNames}
                  availableLists={listNames}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                  onDeleteVariableEntity={handleDeleteVariableEntity}
                />
              ))}
              <h2 className="text-lg font-bold mb-2 mt-4">Looks</h2>
              {sidebarBlocks.filter(block => block.type === LOOKS).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableVariables={variableNames}
                  availableLists={listNames}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                  onDeleteVariableEntity={handleDeleteVariableEntity}
                />
              ))}
              <h2 className="text-lg font-bold mb-2 mt-4">Sound</h2>
              {sidebarBlocks.filter(block => block.type === SOUND).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableVariables={variableNames}
                  availableLists={listNames}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                  onDeleteVariableEntity={handleDeleteVariableEntity}
                />
              ))}
              <h2 className="text-lg font-bold mb-2 mt-4">Events</h2>
              {sidebarBlocks.filter(block => block.type === EVENTS).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableVariables={variableNames}
                  availableLists={listNames}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                  onDeleteVariableEntity={handleDeleteVariableEntity}
                />
              ))}
              <h2 className="text-lg font-bold mb-2 mt-4">Control</h2>
              {sidebarBlocks.filter(block => block.type === CONTROLS).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableVariables={variableNames}
                  availableLists={listNames}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                  onDeleteVariableEntity={handleDeleteVariableEntity}
                />
              ))}
              <h2 className="text-lg font-bold mb-2 mt-4">Operators</h2>
              {sidebarBlocks.filter(block => block.type === OPERATORS).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableVariables={variableNames}
                  availableLists={listNames}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                  onOperatorValidationMessage={showToast}
                  onDeleteVariableEntity={handleDeleteVariableEntity}
                />
              ))}
              <h2 className="text-lg font-bold mb-2 mt-4">Variables</h2>
              <div className="mb-2 ml-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={openVariableModal}
                  className="w-36 rounded bg-orange-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Create Variable
                </button>
                <button
                  type="button"
                  onClick={openListModal}
                  className="w-36 rounded bg-orange-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Create List
                </button>
              </div>
              {sidebarBlocks.filter(block => block.type === VARIABLES).length === 0 && (
                <div className="rounded bg-white px-3 py-2 text-sm text-gray-500">
                  Create a variable or list to get started.
                </div>
              )}
              {sidebarBlocks
                .filter((block) => block.type === VARIABLES && isVariableReporterAction(block.action))
                .map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableVariables={variableNames}
                  availableLists={listNames}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                  onOperatorValidationMessage={showToast}
                  onDeleteVariableEntity={handleDeleteVariableEntity}
                />
              ))}
              {sidebarBlocks
                .filter((block) => block.type === VARIABLES && !isVariableReporterAction(block.action))
                .map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableVariables={variableNames}
                  availableLists={listNames}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                  onOperatorValidationMessage={showToast}
                  onDeleteVariableEntity={handleDeleteVariableEntity}
                />
              ))}
            </div>
          )}

          {activeSidebarTab === 'sprite' && (
            <div className="rounded-xl border border-gray-200 bg-white/70 p-3 shadow-sm">
              <div className="grid grid-cols-1 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setIsSpriteLibraryOpen(true)}
                  className="flex min-h-[10rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 text-sky-700 transition hover:border-sky-400 hover:bg-sky-100"
                >
                  <span className="text-4xl font-light leading-none">+</span>
                  <span className="mt-2 text-sm font-semibold">Add Sprite</span>
                </button>
                {sprites.map((sprite) => (
                  <div
                    key={sprite.id}
                    onClick={() => setSelectedSpriteId(sprite.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedSpriteId(sprite.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`bg-white border p-2 rounded text-sm font-semibold ${
                      selectedSpriteId === sprite.id ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span>{sprite.name}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveSprite(sprite.id);
                        }}
                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="w-full h-28 bg-gray-50 border rounded flex items-center justify-center overflow-hidden">
                      <div className="w-28 h-28">
                        <SpriteGraphic src={sprite.src} markup={sprite.svgMarkup} color={sprite.color} width="112" height="112" className="block" />
                      </div>
                    </div>
                    <div className="mt-2 text-left text-xs text-gray-500">
                      {(sprite.blocks || []).length} blocks in workspace
                    </div>
                  </div>
                ))}
              </div>
              {sidebarBlocks.filter(block => block.type === SPRITE).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableVariables={variableNames}
                  availableLists={listNames}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                  onDeleteVariableEntity={handleDeleteVariableEntity}
                />
              ))}
            </div>
          )}

          {activeSidebarTab === 'backdrops' && (
            <div className="rounded-xl border border-gray-200 bg-white/70 p-3 shadow-sm">
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setIsBackdropLibraryOpen(true)}
                  className="flex min-h-[10rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100"
                >
                  <span className="text-4xl font-light leading-none">+</span>
                  <span className="mt-2 text-sm font-semibold">Add Backdrop</span>
                </button>
                {availableBackdrops.map((backdrop) => {
                  const isActiveBackdrop = String(backdrop.id) === String(backdropValue);

                  return (
                    <button
                      key={backdrop.id}
                      type="button"
                      onClick={() => handleSelectBackdrop(backdrop.id)}
                      className={`overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        isActiveBackdrop ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200'
                      }`}
                    >
                      <div
                        className="flex h-28 items-center justify-center border-b bg-gray-50"
                        style={{
                          backgroundImage: backdrop.url ? `url(${backdrop.url})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {!backdrop.url && (
                          <span className="text-sm font-semibold text-gray-500">White Space</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 px-3 py-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{backdrop.name}</div>
                          <div className="text-xs text-gray-500">{isActiveBackdrop ? 'Current initial backdrop' : 'Click to set as initial'}</div>
                        </div>
                        {isActiveBackdrop && (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Droppable Area */}
        <div className="w-3/6 p-4 h-[100%]">
        <div className="mb-4 flex items-center justify-center gap-3">
          <h1 className="text-xl font-bold">Workspace</h1>
          {selectedSprite && (
            <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 shadow-sm">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden">
                <SpriteGraphic src={selectedSprite.src} markup={selectedSprite.svgMarkup} color={selectedSprite.color} width="14" height="14" className="block" />
              </div>
              <span className="text-sm font-semibold text-orange-700">{selectedSprite.name}</span>
            </div>
          )}
        </div>
        <p className="text-center mb-2 font-semibold">
          {activeSidebarTab === 'sprite'
            ? (selectedSprite ? `${selectedSprite.name} sprite editor. Update the SVG and apply it to this sprite.` : 'Add a sprite from the navbar to start building.')
            : (selectedSprite ? `${selectedSprite.name} workspace. Drag blocks here and press Run Code.` : 'Add a sprite from the navbar to start building.')}
        </p>
          {activeSidebarTab === 'sprite' ? (
            selectedSprite ? (
              <SpritePaintEditor
                sprite={selectedSprite}
                markup={spriteEditorMarkup || selectedSprite.svgMarkup || ''}
                size={selectedSprite.spriteState?.size ?? 100}
                loadError={spriteEditorError}
                onApply={handleApplySpriteMarkup}
                onReset={handleResetSpriteMarkup}
                onSizeChange={handleSelectedSpriteSizeChange}
              />
            ) : null
          ) : (
            <DroppableArea onDrop={handleDrop}>
              {blocks.map((block, index) => (
                <Block
                  key={block.id}
                  id={block.id}
                  index={index}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  childrenBlocks={block.children || []}
                  elseChildrenBlocks={block.elseChildren || []}
                  onChange={handleBlockChange}
                  onRemove={handleRemoveBlock}
                  moveBlock={moveBlock}
                  isWorkspaceBlock={true}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableVariables={variableNames}
                  availableLists={listNames}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                  onNestedDrop={handleNestedDrop}
                  onNestedBlockChange={handleNestedBlockChange}
                  onNestedBlockRemove={handleRemoveBlock}
                  onOperatorSlotChange={handleOperatorSlotChange}
                  onOperatorSlotDrop={handleOperatorSlotDrop}
                  onOperatorValidationMessage={showToast}
                  onDeleteVariableEntity={handleDeleteVariableEntity}
                />
              ))}
            </DroppableArea>
          )}
        </div>

        {/* Preview Area */}
        {!isPreviewExpanded && (
        <div className="w-3/6 border-l p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="w-24" />
            <h1 className="text-xl font-bold text-center">Preview</h1>
            <button
              type="button"
              onClick={() => setIsPreviewExpanded(true)}
              className="rounded border border-gray-300 bg-white p-2 text-gray-800"
              aria-label="Full screen preview"
              title="Full screen"
            >
              <Maximize2 size={16} />
            </button>
          </div>
          <StagePreview
            previewRef={previewRef}
            spriteRef={spriteRef}
            sprites={sprites}
            selectedSpriteId={activeSpriteId}
            selectedBackdrop={selectedBackdrop}
            onSpritePointerDown={handleSpritePointerDown}
            onSpritePointerMove={handleSpritePointerMove}
            onSpritePointerUp={handleSpritePointerUp}
            onSpriteClick={handleSpriteClick}
            className="border p-4 relative overflow-x-auto overflow-y-auto rounded-xl"
          />
          <PreviewControls
            isRunning={isRunning}
            replayableBlocks={replayableBlocks}
            selectedReplayBlock={selectedReplayBlock}
            selectedReplayBlockId={selectedReplayBlockId}
            setSelectedReplayBlockId={setSelectedReplayBlockId}
            runCode={runCode}
            replaySelectedBlock={replaySelectedBlock}
          />
        </div>
        )}
      </div>
      {isPreviewExpanded && (
        <div className="fixed inset-4 z-40 flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex h-16 flex-shrink-0 items-center justify-between border-b px-5">
            <h1 className="text-lg font-bold">Preview</h1>
            <button
              type="button"
              onClick={() => setIsPreviewExpanded(false)}
              className="rounded bg-gray-900 p-2 text-white"
              aria-label="Small screen preview"
              title="Small screen"
            >
              <Minimize2 size={16} />
            </button>
          </div>
          <div className="min-h-0 flex-1 p-5">
            <StagePreview
              previewRef={previewRef}
              spriteRef={spriteRef}
              sprites={sprites}
              selectedSpriteId={activeSpriteId}
              selectedBackdrop={selectedBackdrop}
              onSpritePointerDown={handleSpritePointerDown}
              onSpritePointerMove={handleSpritePointerMove}
              onSpritePointerUp={handleSpritePointerUp}
              onSpriteClick={handleSpriteClick}
              panelHeight="calc(100vh - 11rem)"
              className="relative overflow-x-auto overflow-y-auto rounded-xl border p-4"
            />
          </div>
          <div className="flex-shrink-0 border-t px-5 py-4">
            <PreviewControls
              isRunning={isRunning}
              replayableBlocks={replayableBlocks}
              selectedReplayBlock={selectedReplayBlock}
              selectedReplayBlockId={selectedReplayBlockId}
              setSelectedReplayBlockId={setSelectedReplayBlockId}
              runCode={runCode}
              replaySelectedBlock={replaySelectedBlock}
              compact
            />
          </div>
        </div>
      )}
      {isSpriteLibraryOpen && (
        <div className="fixed inset-0 z-40 bg-white">
          <div className="flex h-16 items-center justify-between border-b px-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sprite Library</h1>
              <p className="text-sm text-gray-500">Choose a sprite to add to your project.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsSpriteLibraryOpen(false)}
              className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
          <div className="h-[calc(100vh-4rem)] overflow-y-auto px-6 py-6">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={spriteLibrarySearch}
                  onChange={(event) => setSpriteLibrarySearch(event.target.value)}
                  placeholder="Search sprites"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'added', label: 'Added' },
                  { id: 'not-added', label: 'Not Added' },
                ].map((filterOption) => (
                  <button
                    key={filterOption.id}
                    type="button"
                    onClick={() => setSpriteLibraryFilter(filterOption.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      spriteLibraryFilter === filterOption.id ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
              {filteredSpriteLibrary.map((librarySprite) => (
                <button
                  key={librarySprite.id}
                  type="button"
                  onClick={() => handleAddSprite(librarySprite)}
                  className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
                >
                  <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-gray-50">
                    <SpriteGraphic src={librarySprite.src} color={librarySprite.color} width="96" height="96" className="block" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{librarySprite.name}</div>
                </button>
              ))}
            </div>
            {filteredSpriteLibrary.length === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
                No sprites match this search or filter.
              </div>
            )}
          </div>
        </div>
      )}
      {isBackdropLibraryOpen && (
        <div className="fixed inset-0 z-40 bg-white">
          <div className="flex h-16 items-center justify-between border-b px-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Backdrop Library</h1>
              <p className="text-sm text-gray-500">Choose backdrops to add to the current session.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsBackdropLibraryOpen(false)}
              className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
          <div className="h-[calc(100vh-4rem)] overflow-y-auto px-6 py-6">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={backdropLibrarySearch}
                  onChange={(event) => setBackdropLibrarySearch(event.target.value)}
                  placeholder="Search backdrops"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'added', label: 'Added' },
                  { id: 'not-added', label: 'Not Added' },
                ].map((filterOption) => (
                  <button
                    key={filterOption.id}
                    type="button"
                    onClick={() => setBackdropLibraryFilter(filterOption.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      backdropLibraryFilter === filterOption.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filteredBackdropLibrary.map((libraryBackdrop) => {
                const isAdded = availableBackdrops.some((backdrop) => String(backdrop.id) === String(libraryBackdrop.id));

                return (
                  <button
                    key={libraryBackdrop.id}
                    type="button"
                    onClick={() => handleAddBackdropToSession(libraryBackdrop)}
                    className={`overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      isAdded ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div
                      className="flex h-40 items-center justify-center bg-gray-50"
                      style={{
                        backgroundImage: libraryBackdrop.url ? `url(${libraryBackdrop.url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {!libraryBackdrop.url && (
                        <span className="text-sm font-semibold text-gray-500">White Space</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{libraryBackdrop.name}</div>
                        <div className="text-xs text-gray-500">{isAdded ? 'Already in session' : 'Add to session'}</div>
                      </div>
                      {isAdded && (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Added
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredBackdropLibrary.length === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
                No backdrops match this search or filter.
              </div>
            )}
          </div>
        </div>
      )}
      <input
        ref={backdropFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackdropUpload}
        className="hidden"
      />
      <input
        ref={projectFileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleProjectFileChange}
        className="hidden"
      />
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-xl">
          {toastMessage}
        </div>
      )}
      {isVariableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[360px] max-w-[90vw] rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold">{variableModalType === 'variable' ? 'Create Variable' : 'Create List'}</h2>
            <p className="mb-4 text-sm text-gray-600">
              Enter a {variableModalType} name to add a new {variableModalType} block.
            </p>
            <input
              type="text"
              value={pendingVariableName}
              onChange={(event) => setPendingVariableName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleCreateVariable();
                } else if (event.key === 'Escape') {
                  closeVariableModal();
                }
              }}
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-orange-500"
              placeholder={variableModalType === 'variable' ? 'Variable name' : 'List name'}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeVariableModal}
                className="rounded bg-gray-200 px-4 py-2 text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateVariable}
                className="rounded bg-orange-600 px-4 py-2 text-white"
              >
                {variableModalType === 'variable' ? 'Create Variable' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}
      {recordingModalState !== 'closed' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[360px] max-w-[90vw]">
            <h2 className="text-lg font-bold mb-2">Record Sound</h2>
            {recordingModalState === 'confirm' && (
              <>
                <p className="text-sm text-gray-600 mb-4">Start recording a new sound clip?</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeRecordingModal}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void startSoundRecording()}
                    className="px-4 py-2 rounded bg-pink-500 text-white"
                  >
                    Start Record
                  </button>
                </div>
              </>
            )}
            {recordingModalState === 'recording' && (
              <>
                <p className="text-sm text-gray-600 mb-4">Recording in progress. Stop when you are done.</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeRecordingModal}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={stopSoundRecording}
                    className="px-4 py-2 rounded bg-red-500 text-white"
                  >
                    Stop Recording
                  </button>
                </div>
              </>
            )}
            {recordingModalState === 'review' && (
              <>
                <p className="text-sm text-gray-600 mb-4">Recording captured. Save it to the sound list?</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeRecordingModal}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRecordedSound}
                    className="px-4 py-2 rounded bg-pink-500 text-white"
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </DndProvider>
  );
};

export default VisualCodeEditor;
