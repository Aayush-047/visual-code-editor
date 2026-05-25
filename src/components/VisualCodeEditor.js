import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  ChevronDown,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Link2,
  Loader2,
  Maximize2,
  Minimize2,
  Moon,
  Play,
  Rewind,
  Save,
  Search,
  Shapes,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import Block from './Block';
import DroppableArea from './DroppableArea';
import SpeechBubble from './SpeechBubble';
import SpriteGraphic from './SpriteGraphic';
import SpritePaintEditor from './SpritePaintEditor';
import Tooltip from './Tooltip';
import AddedBadge from './AddedBadge';
import {
  EVENTS,
  MOTION,
  LOOKS,
  SOUND,
  SPRITE,
  CONTROLS,
  OPERATORS,
  VARIABLES,
} from '../constants/BlockTypes';
import useExecuteAction from '../hooks/useExecuteAction';
import * as actionTypes from '../constants/ActionTypes';

const DEFAULT_SOUNDS = [{ id: 'meow', name: 'Meow', type: 'builtin', url: '/sounds/Meow.mp3' }];
const LZ_STRING_CDN_URL = 'https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js';

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
const DROPDOWN_MENU_MAX_HEIGHT = 176;
const SPRITE_CATEGORY_MAP = {
  Food: new Set([
    'apple',
    'banana',
    'bread',
    'cake',
    'donut',
    'egg',
    'milk',
    'orange',
    'salad',
    'strawberry',
    'taco',
    'watermelon',
  ]),
  Animals: new Set([
    'bat',
    'bear',
    'butterfly',
    'cat',
    'chick',
    'crab',
    'dog',
    'dove',
    'duck',
    'elephant',
    'fish',
    'fox',
    'frog',
    'giraffe',
    'grasshopper',
    'hare',
    'hedgehog',
    'hen',
    'hippo',
    'horse',
    'jellyfish',
    'ladybug',
    'lion',
    'llama',
    'monkey',
    'mouse',
    'octopus',
    'owl',
    'panther',
    'parrot',
    'penguin',
    'polarbear',
    'rabbit',
    'reindeer',
    'rooster',
    'shark',
    'snake',
    'starfish',
    'toucan',
    'zebra',
  ]),
  Fantasy: new Set(['dinosaur', 'dinosaur2', 'dinosaur3', 'dragon', 'dragonfly', 'griffin']),
  Sports: new Set(['baseball', 'basketball', 'soccer']),
  Music: new Set(['drum', 'guitar', 'keyboard', 'radio', 'speaker', 'trumpet', 'bell']),
  Objects: new Set(['bowl', 'foodtruck', 'glass', 'jar']),
};
const BACKDROP_CATEGORY_MAP = {
  Basics: new Set(['white-space']),
  Nature: new Set([
    'beach',
    'beach2',
    'desert',
    'farm',
    'forest',
    'grass',
    'mountain',
    'slopes',
    'winter',
    'woods',
  ]),
  City: new Set(['city', 'metro', 'night-city', 'urban']),
  Indoors: new Set(['bedroom1', 'bedroom2', 'bedroom3', 'hall', 'school']),
  Sports: new Set(['baseball', 'basketball', 'football', 'playground', 'pool']),
  Space: new Set(['galaxy', 'moon', 'space', 'space-city', 'space-city-2', 'space-ship']),
  Fantasy: new Set(['castle', 'jurassic', 'witchhouse']),
  Events: new Set(['concert', 'party']),
  Water: new Set(['underwater', 'underwater2']),
};
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
const isVariableReporterAction = (action) =>
  action === actionTypes.VARIABLE_REPORTER || action === actionTypes.LIST_REPORTER;
const shouldApplyStepDelay = (block) => !TIMED_ACTIONS.has(block?.action);
const getSpriteCategory = (sprite) => {
  if (sprite?.type === 'uploaded') return 'My Uploads';
  const normalizedId = String(sprite?.id || sprite?.libraryId || '').toLowerCase();
  const match = Object.entries(SPRITE_CATEGORY_MAP).find(([, ids]) => ids.has(normalizedId));
  return match?.[0] || 'Objects';
};
const getBackdropCategory = (backdrop) => {
  if (backdrop?.type === 'uploaded') return 'My Uploads';
  const normalizedId = String(backdrop?.id || '').toLowerCase();
  const match = Object.entries(BACKDROP_CATEGORY_MAP).find(([, ids]) => ids.has(normalizedId));
  return match?.[0] || 'Scenes';
};

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
            <SpeechBubble
              message={sprite.speechBubble.message}
              isThinking={sprite.speechBubble.isThinking}
            />
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

const FloatingDropdownMenu = ({
  isOpen,
  triggerRef,
  width = 176,
  placement = 'auto',
  children,
}) => {
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
      const opensBelow =
        placement === 'bottom'
          ? true
          : placement === 'top'
            ? false
            : spaceBelow >= Math.min(DROPDOWN_MENU_MAX_HEIGHT, spaceAbove);
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
        maxHeight: Math.max(
          80,
          Math.min(DROPDOWN_MENU_MAX_HEIGHT, opensBelow ? spaceBelow - gap : spaceAbove - gap)
        ),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, placement, triggerRef, width]);

  if (!isOpen || !menuStyle) {
    return null;
  }

  return createPortal(
    <div
      data-floating-dropdown-menu="true"
      className="fixed z-[9999] overflow-y-auto rounded border border-gray-200 bg-white text-black shadow-2xl"
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

const BackdropSwatch = ({
  backdrop,
  className = 'h-5 w-5 rounded-md border border-emerald-200',
}) => (
  <div
    className={`${className} flex flex-shrink-0 items-center justify-center overflow-hidden bg-white`}
    style={{
      backgroundImage: backdrop?.url ? `url(${backdrop.url})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    {!backdrop?.url && <span className="text-[9px] font-semibold text-gray-500">BG</span>}
  </div>
);

const AssetCategoryDropdown = ({
  value,
  options,
  onChange,
  accentClassName = 'text-gray-700',
  menuActiveClassName = 'bg-gray-100 font-semibold text-gray-900',
}) => {
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = value === 'all' ? 'All Categories' : value;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        event.target.closest('[data-floating-dropdown-menu="true"]')
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={triggerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-10 items-center justify-between gap-3 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold shadow-sm ${accentClassName}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <FloatingDropdownMenu isOpen={isOpen} triggerRef={triggerRef} width={208} placement="bottom">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              onChange(option);
              setIsOpen(false);
            }}
            className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
              value === option ? menuActiveClassName : 'text-gray-800'
            }`}
          >
            {option === 'all' ? 'All Categories' : option}
          </button>
        ))}
      </FloatingDropdownMenu>
    </div>
  );
};

const PreviewControls = ({
  isRunning,
  replayableBlocks,
  selectedReplayBlock,
  selectedReplayBlockId,
  setSelectedReplayBlockId,
  runCode,
  replaySelectedBlock,
  stopCurrentSprite,
  stopAllCode,
  compact = false,
  shouldPulseRun = false,
}) => {
  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);
  const [pendingReplayBlockId, setPendingReplayBlockId] = useState(selectedReplayBlockId);

  useEffect(() => {
    if (replayableBlocks.length === 0 || isRunning) {
      setIsReplayModalOpen(false);
    }
  }, [isRunning, replayableBlocks.length]);

  useEffect(() => {
    if (!isReplayModalOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsReplayModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isReplayModalOpen]);

  useEffect(() => {
    setPendingReplayBlockId(selectedReplayBlockId || replayableBlocks[0]?.id || '');
  }, [replayableBlocks, selectedReplayBlockId]);

  return (
    <>
      <div className={`bottom-bar ${compact ? '' : 'mt-4 justify-start'} max-[479px]:justify-start`}>
        <button
          type="button"
          onClick={runCode}
          disabled={isRunning}
          className={`btn-run-code flex items-center rounded-xl bg-green-500 text-white ${isRunning ? 'cursor-not-allowed opacity-50' : ''} ${shouldPulseRun ? 'run-pulse' : ''}`}
        >
          {isRunning ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Play size={16} className="mr-2" />
          )}
          Run Code
        </button>
        <button
          type="button"
          onClick={() => setIsReplayModalOpen(true)}
          disabled={replayableBlocks.length === 0 || isRunning}
          className={`flex items-center rounded bg-blue-500 px-3 py-2 text-white ${replayableBlocks.length === 0 || isRunning ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Rewind size={16} className="mr-1" /> Replay
        </button>
        <button
          type="button"
          onClick={stopCurrentSprite}
          disabled={!isRunning}
          className={`preview-stop-current rounded px-3 py-2 text-white ${!isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Stop Sprite
        </button>
        <button
          type="button"
          onClick={stopAllCode}
          disabled={!isRunning}
          className={`preview-stop-all rounded px-3 py-2 text-white ${!isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Stop All
        </button>
      </div>
      {isReplayModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3">
              <h2 className="text-base font-bold text-slate-900">Replay Block</h2>
              <p className="text-sm text-slate-500">Choose which block to replay.</p>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {replayableBlocks.map((block, blockIndex) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => setPendingReplayBlockId(block.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                    pendingReplayBlockId === block.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{describeBlock(block)}</span>
                  <span className="ml-3 text-xs font-semibold text-slate-400">{blockIndex + 1}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReplayModalOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const blockToReplay =
                    replayableBlocks.find((block) => block.id === pendingReplayBlockId) ||
                    replayableBlocks[0];
                  setSelectedReplayBlockId(blockToReplay?.id || '');
                  setIsReplayModalOpen(false);
                  void replaySelectedBlock(blockToReplay);
                }}
                disabled={!pendingReplayBlockId}
                className={`rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white ${
                  !pendingReplayBlockId ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
  ...(isEventTriggerAction(item.action) || isControlContainerAction(item.action)
    ? { children: [] }
    : {}),
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

  if (
    (block.children || []).some(
      (childBlock) => childBlock.id === blockId || blockContainsId(childBlock, blockId)
    )
  ) {
    return true;
  }

  if (
    (block.elseChildren || []).some(
      (childBlock) => childBlock.id === blockId || blockContainsId(childBlock, blockId)
    )
  ) {
    return true;
  }

  return Object.values(block.value || {})
    .map(getOperatorSlotBlock)
    .filter(Boolean)
    .some((slotBlock) => slotBlock.id === blockId || blockContainsId(slotBlock, blockId));
};

const removeBlockById = (blocksToUpdate, blockId) =>
  blocksToUpdate
    .filter((block) => block.id !== blockId)
    .map((block) => ({
      ...block,
      children: block.children ? removeBlockById(block.children, blockId) : block.children,
      elseChildren: block.elseChildren
        ? removeBlockById(block.elseChildren, blockId)
        : block.elseChildren,
      value: mapOperatorSlotBlocks(block.value, (slotBlock) =>
        slotBlock.id === blockId
          ? ''
          : {
              ...slotBlock,
              value: mapOperatorSlotBlocks(
                slotBlock.value,
                (nestedSlotBlock) => removeBlockById([nestedSlotBlock], blockId)[0] || ''
              ),
            }
      ),
    }));

const appendChildBlock = (blocksToUpdate, parentId, childBlock, branchName = 'children') =>
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
        elseChildren: block.elseChildren
          ? appendChildBlock(block.elseChildren, parentId, childBlock, branchName)
          : block.elseChildren,
      };
    }

    return block;
  });

const updateBlockValueById = (blocksToUpdate, blockId, value) =>
  blocksToUpdate.map((block) => {
    if (block.id === blockId) {
      return { ...block, value };
    }

    if (block.children) {
      return {
        ...block,
        children: updateBlockValueById(block.children, blockId, value),
        elseChildren: block.elseChildren
          ? updateBlockValueById(block.elseChildren, blockId, value)
          : block.elseChildren,
      };
    }

    return {
      ...block,
      value: mapOperatorSlotBlocks(
        block.value,
        (slotBlock) => updateBlockValueById([slotBlock], blockId, value)[0]
      ),
    };
  });

const updateOperatorSlotById = (blocksToUpdate, blockId, slotName, slotValue) =>
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
      children: block.children
        ? updateOperatorSlotById(block.children, blockId, slotName, slotValue)
        : block.children,
      elseChildren: block.elseChildren
        ? updateOperatorSlotById(block.elseChildren, blockId, slotName, slotValue)
        : block.elseChildren,
      value: mapOperatorSlotBlocks(
        block.value,
        (slotBlock) => updateOperatorSlotById([slotBlock], blockId, slotName, slotValue)[0]
      ),
    };
  });

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const BLOCK_STEP_DELAY_MS = 1000;
const ROOT_SVG_STYLE = 'width:100%;height:100%;display:block;';
const cloneBlocks = (blocks) => JSON.parse(JSON.stringify(blocks || []));
const normalizeSvgMarkup = (markup) => {
  if (!markup || !/<svg[\s>]/i.test(markup)) {
    return markup;
  }

  return markup.replace(/<svg\b([^>]*)>/i, (fullMatch, attributes = '') => {
    const styleMatch = attributes.match(/\sstyle=(['"])(.*?)\1/i);

    if (styleMatch) {
      const quote = styleMatch[1];
      const existingStyle = styleMatch[2];
      const normalizedExistingStyle =
        existingStyle.trim().endsWith(';') || existingStyle.trim() === ''
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

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const savedTheme = window.localStorage.getItem('theme');
  const resolvedTheme =
    savedTheme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  return resolvedTheme === 'dark';
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

const removeVariableReporterBlocks = (blocksToUpdate, entityType, entityName) =>
  blocksToUpdate
    .filter((block) => {
      if (entityType === 'variable') {
        return !(
          block.type === VARIABLES &&
          block.action === actionTypes.VARIABLE_REPORTER &&
          block.value?.name === entityName
        );
      }

      return !(
        block.type === VARIABLES &&
        block.action === actionTypes.LIST_REPORTER &&
        block.value?.name === entityName
      );
    })
    .map((block) => ({
      ...block,
      children: block.children
        ? removeVariableReporterBlocks(block.children, entityType, entityName)
        : block.children,
      elseChildren: block.elseChildren
        ? removeVariableReporterBlocks(block.elseChildren, entityType, entityName)
        : block.elseChildren,
      value: mapOperatorSlotBlocks(
        block.value,
        (slotBlock) => removeVariableReporterBlocks([slotBlock], entityType, entityName)[0] || ''
      ),
    }));

const VisualCodeEditor = () => {
  const [toasts, setToasts] = useState([]);
  const spriteRef = useRef(null);
  const previewRef = useRef(null);
  const spriteLibrarySearchRef = useRef(null);
  const backdropLibrarySearchRef = useRef(null);
  const toastTimeoutRef = useRef([]);
  const removalTimeoutsRef = useRef([]);
  const blockHistoryRef = useRef({});
  const spriteDragRef = useRef({ isDragging: false, hasMoved: false, offsetX: 0, offsetY: 0 });
  const spriteFileInputRef = useRef(null);
  const backdropFileInputRef = useRef(null);
  const projectFileInputRef = useRef(null);
  const pendingBackdropChangeRef = useRef(null);
  const sessionBackdropsRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const activeAudiosRef = useRef([]);
  const runSessionRef = useRef({ id: 0, stoppedSprites: new Set() });
  const [isRunning, setIsRunning] = useState(false);
  const [isRecordingSound, setIsRecordingSound] = useState(false);
  const [sounds, setSounds] = useState(DEFAULT_SOUNDS);
  const [soundVolume, setSoundVolume] = useState(100);
  const [backdropLibrary, setBackdropLibrary] = useState(BACKDROP_LIBRARY);
  const [stageState, setStageState] = useState(() => ({
    backdropId: BACKDROP_LIBRARY[0].id,
    backdrops: [BACKDROP_LIBRARY[0]],
  }));
  const [recordingModalState, setRecordingModalState] = useState('closed');
  const [pendingRecordedSound, setPendingRecordedSound] = useState(null);
  const [selectedReplayBlockId, setSelectedReplayBlockId] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [removingBlockIds, setRemovingBlockIds] = useState([]);
  const [recentlyAddedBlockIds, setRecentlyAddedBlockIds] = useState([]);
  const [hasDismissedRunNudge, setHasDismissedRunNudge] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
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
  const [isSpriteSelectorOpen, setIsSpriteSelectorOpen] = useState(false);
  const [isBackdropSelectorOpen, setIsBackdropSelectorOpen] = useState(false);
  const [isSpriteLibraryOpen, setIsSpriteLibraryOpen] = useState(false);
  const [isBackdropLibraryOpen, setIsBackdropLibraryOpen] = useState(false);
  const [spriteLibrarySearch, setSpriteLibrarySearch] = useState('');
  const [spriteLibraryFilter, setSpriteLibraryFilter] = useState('all');
  const [spriteCategoryFilter, setSpriteCategoryFilter] = useState('all');
  const [backdropLibrarySearch, setBackdropLibrarySearch] = useState('');
  const [backdropLibraryFilter, setBackdropLibraryFilter] = useState('all');
  const [backdropCategoryFilter, setBackdropCategoryFilter] = useState('all');
  const [spriteEditorMarkup, setSpriteEditorMarkup] = useState('');
  const [spriteEditorError, setSpriteEditorError] = useState('');
  const fileMenuRef = useRef(null);
  const assetsMenuRef = useRef(null);
  const spriteSelectorRef = useRef(null);
  const backdropSelectorRef = useRef(null);
  const spritesRef = useRef([INITIAL_SPRITE]);
  const triggerBroadcastListenersRef = useRef(() => {});
  const lzStringLoaderRef = useRef(null);
  const hasRestoredSharedProjectRef = useRef(false);
  const previousBackdropValueRef = useRef(stageState.backdropId);
  const [sidebarBlocks, setSidebarBlocks] = useState([
    { id: 'sidebar-move-x', type: MOTION, action: actionTypes.MOVE_X, value: 10 },
    { id: 'sidebar-move-y', type: MOTION, action: actionTypes.MOVE_Y, value: 10 },
    { id: 'sidebar-turn-right', type: MOTION, action: actionTypes.TURN_RIGHT, value: 15 },
    { id: 'sidebar-turn-left', type: MOTION, action: actionTypes.TURN_LEFT, value: 15 },
    { id: 'sidebar-goto', type: MOTION, action: actionTypes.GOTO, value: [0, 0] },
    { id: 'sidebar-goto-random', type: MOTION, action: actionTypes.GOTO_RANDOM, value: null },
    {
      id: 'sidebar-point-in-direction',
      type: MOTION,
      action: actionTypes.POINT_IN_DIRECTION,
      value: 90,
    },
    {
      id: 'sidebar-point-towards-random',
      type: MOTION,
      action: actionTypes.POINT_TOWARDS_RANDOM,
      value: null,
    },
    { id: 'sidebar-say', type: LOOKS, action: actionTypes.SAY, value: 'Hello!' },
    { id: 'sidebar-think', type: LOOKS, action: actionTypes.THINK, value: 'Hmm...' },
    {
      id: 'sidebar-say-timer',
      type: LOOKS,
      action: actionTypes.SAY_TIMER,
      value: { message: 'Hello!', duration: 2 },
    },
    {
      id: 'sidebar-think-timer',
      type: LOOKS,
      action: actionTypes.THINK_TIMER,
      value: { message: 'Hmm...', duration: 2 },
    },
    { id: 'sidebar-change-size-to', type: LOOKS, action: actionTypes.CHANGE_SIZE_TO, value: 100 },
    { id: 'sidebar-change-size-by', type: LOOKS, action: actionTypes.CHANGE_SIZE_BY, value: 10 },
    { id: 'sidebar-change-color', type: LOOKS, action: actionTypes.CHANGE_COLOR, value: '#FFAB19' },
    {
      id: 'sidebar-change-backdrop',
      type: LOOKS,
      action: actionTypes.CHANGE_BACKDROP,
      value: BACKDROP_LIBRARY[0].id,
    },
    { id: 'sidebar-hide', type: LOOKS, action: actionTypes.HIDE, value: null },
    { id: 'sidebar-show', type: LOOKS, action: actionTypes.SHOW, value: null },
    { id: 'sidebar-play-sound', type: SOUND, action: actionTypes.PLAY_SOUND, value: 'meow' },
    { id: 'sidebar-set-volume', type: SOUND, action: actionTypes.SET_VOLUME, value: 100 },
    {
      id: 'sidebar-change-volume-by',
      type: SOUND,
      action: actionTypes.CHANGE_VOLUME_BY,
      value: 10,
    },
    {
      id: 'sidebar-clear-all-sounds',
      type: SOUND,
      action: actionTypes.CLEAR_ALL_SOUNDS,
      value: null,
    },
    {
      id: 'sidebar-when-key-pressed',
      type: EVENTS,
      action: actionTypes.WHEN_KEY_PRESSED,
      value: 'Space',
    },
    {
      id: 'sidebar-when-sprite-clicked',
      type: EVENTS,
      action: actionTypes.WHEN_SPRITE_CLICKED,
      value: null,
    },
    {
      id: 'sidebar-when-backdrop-switches-to',
      type: EVENTS,
      action: actionTypes.WHEN_BACKDROP_SWITCHES_TO,
      value: BACKDROP_LIBRARY[0].id,
    },
    {
      id: 'sidebar-when-loudness-greater-than',
      type: EVENTS,
      action: actionTypes.WHEN_LOUDNESS_GREATER_THAN,
      value: 10,
    },
    {
      id: 'sidebar-when-i-receive',
      type: EVENTS,
      action: actionTypes.WHEN_I_RECEIVE,
      value: 'Hello!',
    },
    {
      id: 'sidebar-broadcast-message-for',
      type: EVENTS,
      action: actionTypes.BROADCAST_MESSAGE_FOR,
      value: 'Hello!',
    },
    { id: 'sidebar-wait-seconds', type: CONTROLS, action: actionTypes.WAIT_SECONDS, value: 1 },
    {
      id: 'sidebar-repeat-times',
      type: CONTROLS,
      action: actionTypes.REPEAT_TIMES,
      value: { times: 10 },
    },
    { id: 'sidebar-forever', type: CONTROLS, action: actionTypes.FOREVER, value: null },
    {
      id: 'sidebar-if-then',
      type: CONTROLS,
      action: actionTypes.IF_THEN,
      value: { condition: '' },
    },
    {
      id: 'sidebar-if-then-else',
      type: CONTROLS,
      action: actionTypes.IF_THEN_ELSE,
      value: { condition: '' },
    },
    {
      id: 'sidebar-wait-until',
      type: CONTROLS,
      action: actionTypes.WAIT_UNTIL,
      value: { condition: '' },
    },
    {
      id: 'sidebar-repeat-until',
      type: CONTROLS,
      action: actionTypes.REPEAT_UNTIL,
      value: { condition: '' },
    },
    {
      id: 'sidebar-operator-add',
      type: OPERATORS,
      action: actionTypes.OPERATOR_ADD,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-subtract',
      type: OPERATORS,
      action: actionTypes.OPERATOR_SUBTRACT,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-multiply',
      type: OPERATORS,
      action: actionTypes.OPERATOR_MULTIPLY,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-divide',
      type: OPERATORS,
      action: actionTypes.OPERATOR_DIVIDE,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-modulo',
      type: OPERATORS,
      action: actionTypes.OPERATOR_MODULO,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-less-than',
      type: OPERATORS,
      action: actionTypes.OPERATOR_LESS_THAN,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-equals',
      type: OPERATORS,
      action: actionTypes.OPERATOR_EQUALS,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-greater-than',
      type: OPERATORS,
      action: actionTypes.OPERATOR_GREATER_THAN,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-and',
      type: OPERATORS,
      action: actionTypes.OPERATOR_AND,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-or',
      type: OPERATORS,
      action: actionTypes.OPERATOR_OR,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-not',
      type: OPERATORS,
      action: actionTypes.OPERATOR_NOT,
      value: { operand: '' },
    },
    {
      id: 'sidebar-operator-join',
      type: OPERATORS,
      action: actionTypes.OPERATOR_JOIN,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-operator-letter-of',
      type: OPERATORS,
      action: actionTypes.OPERATOR_LETTER_OF,
      value: { index: '', source: '' },
    },
    {
      id: 'sidebar-operator-length-of',
      type: OPERATORS,
      action: actionTypes.OPERATOR_LENGTH_OF,
      value: { source: '' },
    },
    {
      id: 'sidebar-operator-contains',
      type: OPERATORS,
      action: actionTypes.OPERATOR_CONTAINS,
      value: { source: '', target: '' },
    },
    {
      id: 'sidebar-operator-math-function',
      type: OPERATORS,
      action: actionTypes.OPERATOR_MATH_FUNCTION,
      value: { fn: 'abs', operand: '' },
    },
    {
      id: 'sidebar-operator-pick-random',
      type: OPERATORS,
      action: actionTypes.OPERATOR_PICK_RANDOM,
      value: { left: '', right: '' },
    },
    {
      id: 'sidebar-set-variable-to',
      type: VARIABLES,
      action: actionTypes.SET_VARIABLE_TO,
      value: { variableName: '', input: '' },
    },
    {
      id: 'sidebar-change-variable-by',
      type: VARIABLES,
      action: actionTypes.CHANGE_VARIABLE_BY,
      value: { variableName: '', amount: 1 },
    },
    {
      id: 'sidebar-add-to-list',
      type: VARIABLES,
      action: actionTypes.ADD_TO_LIST,
      value: { item: '', listName: '' },
    },
    {
      id: 'sidebar-delete-from-list',
      type: VARIABLES,
      action: actionTypes.DELETE_FROM_LIST,
      value: { index: 1, listName: '' },
    },
    {
      id: 'sidebar-delete-all-of-list',
      type: VARIABLES,
      action: actionTypes.DELETE_ALL_OF_LIST,
      value: { listName: '' },
    },
    {
      id: 'sidebar-insert-at-list',
      type: VARIABLES,
      action: actionTypes.INSERT_AT_LIST,
      value: { item: '', index: 1, listName: '' },
    },
    {
      id: 'sidebar-replace-item-in-list',
      type: VARIABLES,
      action: actionTypes.REPLACE_ITEM_IN_LIST,
      value: { index: 1, item: '', listName: '' },
    },
  ]);

  const executeAction = useExecuteAction();
  const backdropValue = stageState.backdropId;
  const sessionBackdrops = stageState.backdrops;
  const setBackdropValue = useCallback((nextBackdropValue) => {
    setStageState((prevStageState) => ({
      ...prevStageState,
      backdropId:
        typeof nextBackdropValue === 'function'
          ? nextBackdropValue(prevStageState.backdropId)
          : nextBackdropValue,
    }));
  }, []);
  const setSessionBackdrops = useCallback((nextBackdrops) => {
    setStageState((prevStageState) => ({
      ...prevStageState,
      backdrops:
        typeof nextBackdrops === 'function'
          ? nextBackdrops(prevStageState.backdrops)
          : nextBackdrops,
    }));
  }, []);
  const availableBackdrops = sessionBackdrops;
  const activeSpriteId = selectedSpriteId || sprites[0]?.id || '';
  const selectedSprite =
    sprites.find((sprite) => sprite.id === activeSpriteId) || sprites[0] || null;
  const blocks = selectedSprite?.blocks || EMPTY_BLOCKS;
  const hasBlocks = blocks.length > 0;
  const spriteState = selectedSprite?.spriteState || { x: 0, y: 0, rotation: -90, size: 100 };
  const selectedBackdrop =
    availableBackdrops.find(({ id }) => id === String(backdropValue)) || availableBackdrops[0];
  const replayableBlocks = blocks.filter((block) => !isEventTriggerAction(block.action));
  const selectedReplayBlock =
    replayableBlocks.find((block) => block.id === selectedReplayBlockId) ||
    replayableBlocks[0] ||
    null;
  const filteredSpriteLibrary = spriteLibrary.filter((librarySprite) => {
    const matchesSearch = librarySprite.name
      .toLowerCase()
      .includes(spriteLibrarySearch.trim().toLowerCase());
    const matchesCategory =
      spriteCategoryFilter === 'all' || getSpriteCategory(librarySprite) === spriteCategoryFilter;
    const isAdded = sprites.some(
      (sprite) =>
        sprite.libraryId === librarySprite.id ||
        String(sprite.src || '') === String(librarySprite.src || '')
    );

    if (spriteLibraryFilter === 'added') {
      return matchesSearch && matchesCategory && isAdded;
    }

    if (spriteLibraryFilter === 'not-added') {
      return matchesSearch && matchesCategory && !isAdded;
    }

    return matchesSearch && matchesCategory;
  });
  const spriteCategoryOptions = [
    'all',
    ...Array.from(new Set(spriteLibrary.map(getSpriteCategory))).sort(),
  ];
  const filteredBackdropLibrary = backdropLibrary.filter((libraryBackdrop) => {
    const matchesSearch = libraryBackdrop.name
      .toLowerCase()
      .includes(backdropLibrarySearch.trim().toLowerCase());
    const matchesCategory =
      backdropCategoryFilter === 'all' ||
      getBackdropCategory(libraryBackdrop) === backdropCategoryFilter;
    const isAdded = availableBackdrops.some(
      (backdrop) => String(backdrop.id) === String(libraryBackdrop.id)
    );

    if (backdropLibraryFilter === 'added') {
      return matchesSearch && matchesCategory && isAdded;
    }

    if (backdropLibraryFilter === 'not-added') {
      return matchesSearch && matchesCategory && !isAdded;
    }

    return matchesSearch && matchesCategory;
  });
  const backdropCategoryOptions = [
    'all',
    ...Array.from(new Set(backdropLibrary.map(getBackdropCategory))).sort(),
  ];
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    const timeoutId = window.setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
      toastTimeoutRef.current = toastTimeoutRef.current.filter((activeId) => activeId !== timeoutId);
    }, duration);

    toastTimeoutRef.current.push(timeoutId);
  }, []);

  const ensureLZStringLoaded = useCallback(() => {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Sharing is only available in the browser.'));
    }

    if (
      window.LZString?.compressToEncodedURIComponent &&
      window.LZString?.decompressFromEncodedURIComponent
    ) {
      return Promise.resolve(window.LZString);
    }

    if (lzStringLoaderRef.current) {
      return lzStringLoaderRef.current;
    }

    lzStringLoaderRef.current = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${LZ_STRING_CDN_URL}"]`);

      const handleReady = () => {
        if (
          window.LZString?.compressToEncodedURIComponent &&
          window.LZString?.decompressFromEncodedURIComponent
        ) {
          resolve(window.LZString);
          return;
        }

        reject(new Error('Unable to load sharing tools.'));
      };

      if (existingScript) {
        existingScript.addEventListener('load', handleReady, { once: true });
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Unable to load sharing tools.')),
          { once: true }
        );
        return;
      }

      const script = document.createElement('script');
      script.src = LZ_STRING_CDN_URL;
      script.async = true;
      script.onload = handleReady;
      script.onerror = () => reject(new Error('Unable to load sharing tools.'));
      document.head.appendChild(script);
    }).catch((error) => {
      lzStringLoaderRef.current = null;
      throw error;
    });

    return lzStringLoaderRef.current;
  }, []);

  const updateSpriteById = useCallback((spriteId, updater) => {
    setSprites((prevSprites) =>
      prevSprites.map((sprite) => (sprite.id === spriteId ? updater(sprite) : sprite))
    );
  }, []);

  const updateSelectedSprite = useCallback(
    (updater) => {
      const spriteId = selectedSpriteId || sprites[0]?.id;
      if (!spriteId) {
        return;
      }

      updateSpriteById(spriteId, updater);
    },
    [selectedSpriteId, sprites, updateSpriteById]
  );

  const setSelectedSpriteState = useCallback(
    (nextState) => {
      updateSelectedSprite((sprite) => ({
        ...sprite,
        spriteState: typeof nextState === 'function' ? nextState(sprite.spriteState) : nextState,
      }));
    },
    [updateSelectedSprite]
  );

  const setSpriteSpeechBubble = useCallback(
    (spriteId, nextBubble) => {
      updateSpriteById(spriteId, (sprite) => ({
        ...sprite,
        speechBubble:
          typeof nextBubble === 'function' ? nextBubble(sprite.speechBubble) : nextBubble,
      }));
    },
    [updateSpriteById]
  );

  const pushBlockHistory = useCallback((spriteId, nextBlocksSnapshot) => {
    if (!spriteId) {
      return;
    }

    const previousEntries = blockHistoryRef.current[spriteId] || [];
    blockHistoryRef.current[spriteId] = [
      ...previousEntries.slice(-29),
      cloneBlocks(nextBlocksSnapshot),
    ];
  }, []);

  const mutateSelectedSpriteBlocks = useCallback(
    (updater, { recordHistory = true } = {}) => {
      const spriteId = activeSpriteId;

      if (!spriteId) {
        return;
      }

      updateSpriteById(spriteId, (sprite) => {
        const previousBlocks = sprite.blocks || [];
        const nextBlocks = updater(previousBlocks);

        if (recordHistory) {
          pushBlockHistory(spriteId, previousBlocks);
        }

        return {
          ...sprite,
          blocks: nextBlocks,
        };
      });
    },
    [activeSpriteId, pushBlockHistory, updateSpriteById]
  );

  const clearAllSpriteSpeechBubbles = useCallback(() => {
    setSprites((prevSprites) =>
      prevSprites.map((sprite) => ({
        ...sprite,
        speechBubble: { message: '', isThinking: false },
      }))
    );
  }, []);

  const stopAllActiveSounds = useCallback(() => {
    activeAudiosRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    activeAudiosRef.current = [];
  }, []);

  const isSpriteRunAborted = useCallback((sessionId, spriteId) => {
    const currentSession = runSessionRef.current;
    return currentSession.id !== sessionId || currentSession.stoppedSprites.has(spriteId);
  }, []);

  const abortablePause = useCallback(
    async (ms, sessionId, spriteId) => {
      const endTime = Date.now() + Math.max(0, ms);
      while (Date.now() < endTime) {
        if (isSpriteRunAborted(sessionId, spriteId)) {
          return false;
        }
        await pause(Math.min(50, endTime - Date.now()));
      }
      return !isSpriteRunAborted(sessionId, spriteId);
    },
    [isSpriteRunAborted]
  );

  useEffect(() => {
    spritesRef.current = sprites;
  }, [sprites]);

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [isDarkMode]);

  useEffect(() => {
    if (!isFileMenuOpen && !isAssetsMenuOpen && !isSpriteSelectorOpen && !isBackdropSelectorOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        fileMenuRef.current?.contains(event.target) ||
        assetsMenuRef.current?.contains(event.target) ||
        spriteSelectorRef.current?.contains(event.target) ||
        backdropSelectorRef.current?.contains(event.target) ||
        event.target.closest('[data-floating-dropdown-menu="true"]')
      ) {
        return;
      }

      setIsFileMenuOpen(false);
      setIsAssetsMenuOpen(false);
      setIsSpriteSelectorOpen(false);
      setIsBackdropSelectorOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsFileMenuOpen(false);
        setIsAssetsMenuOpen(false);
        setIsSpriteSelectorOpen(false);
        setIsBackdropSelectorOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAssetsMenuOpen, isBackdropSelectorOpen, isFileMenuOpen, isSpriteSelectorOpen]);

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
            const hasOnlyFallbackBackdrop =
              prevBackdrops.length === 1 &&
              String(prevBackdrops[0]?.id) === String(BACKDROP_LIBRARY[0].id);
            return hasOnlyFallbackBackdrop ? [libraryBackdrops[0]] : prevBackdrops;
          });
          setBackdropValue((prevBackdropValue) =>
            prevBackdropValue === BACKDROP_LIBRARY[0].id && libraryBackdrops[0]?.id
              ? String(libraryBackdrops[0].id)
              : prevBackdropValue
          );
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
  }, [setBackdropValue, setSessionBackdrops]);

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

  const getProjectState = useCallback(
    () => ({
      sprites,
      sidebarBlocks,
      variableNames,
      listNames,
      variableValues,
      listValues,
      stageState,
      backdropValue,
      sessionBackdrops,
      sounds,
      soundVolume,
      selectedSpriteId,
    }),
    [
      stageState,
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
    ]
  );

  const getShareProjectState = useCallback(
    () => ({
      format: 'visual-code-editor-share',
      version: 2,
      state: getProjectState(),
    }),
    [getProjectState]
  );

  const applyProjectState = useCallback((state = {}) => {
    const nextSprites =
      Array.isArray(state.sprites) && state.sprites.length > 0
        ? state.sprites.map((sprite) => ({
            ...sprite,
            src:
              sprite.src ||
              SPRITE_LIBRARY.find((librarySprite) => librarySprite.id === sprite.libraryId)?.src ||
              SPRITE_LIBRARY[0].src,
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
    setSidebarBlocks((prevBlocks) =>
      Array.isArray(state.sidebarBlocks) ? state.sidebarBlocks : prevBlocks
    );
    setVariableNames(Array.isArray(state.variableNames) ? state.variableNames : []);
    setListNames(Array.isArray(state.listNames) ? state.listNames : []);
    setVariableValues(
      state.variableValues && typeof state.variableValues === 'object' ? state.variableValues : {}
    );
    setListValues(state.listValues && typeof state.listValues === 'object' ? state.listValues : {});
    const nextStageBackdrops =
      Array.isArray(state.stageState?.backdrops) && state.stageState.backdrops.length > 0
        ? state.stageState.backdrops
        : Array.isArray(state.sessionBackdrops) && state.sessionBackdrops.length > 0
          ? state.sessionBackdrops
          : [
              BACKDROP_LIBRARY[0],
              ...(Array.isArray(state.uploadedBackdrops) ? state.uploadedBackdrops : []),
            ];
    const nextStageBackdropId = nextStageBackdrops.some(
      (backdrop) =>
        String(backdrop.id) ===
        String(state.stageState?.backdropId ?? state.backdropValue ?? BACKDROP_LIBRARY[0].id)
    )
      ? String(state.stageState?.backdropId ?? state.backdropValue ?? BACKDROP_LIBRARY[0].id)
      : String(nextStageBackdrops[0]?.id ?? BACKDROP_LIBRARY[0].id);
    setStageState({
      backdropId: nextStageBackdropId,
      backdrops: nextStageBackdrops,
    });
    setSounds(Array.isArray(state.sounds) ? state.sounds : DEFAULT_SOUNDS);
    setSoundVolume(state.soundVolume ?? 100);
    setSelectedSpriteId(state.selectedSpriteId || nextSprites[0]?.id || '');
    setActiveSidebarTab('blocks');
  }, []);

  const restoreProjectFromHash = useCallback(async () => {
    const sharedHash = window.location.hash.replace(/^#/, '');

    if (!sharedHash) {
      return false;
    }

    const lzString = await ensureLZStringLoaded();
    const decompressedProject = lzString.decompressFromEncodedURIComponent(sharedHash);

    if (!decompressedProject) {
      throw new Error('Shared link is invalid or corrupted.');
    }

    const parsedProject = JSON.parse(decompressedProject);
    const normalizedSharedState =
      parsedProject?.format === 'visual-code-editor-share'
        ? parsedProject.state || {
            sprites: parsedProject.sprites,
            stageState: parsedProject.stageState,
            variableNames: parsedProject.variableNames,
            listNames: parsedProject.listNames,
            variableValues: parsedProject.variableValues,
            listValues: parsedProject.listValues,
            sounds: parsedProject.sounds,
            soundVolume: parsedProject.soundVolume,
            selectedSpriteId: parsedProject.selectedSpriteId,
          }
        : parsedProject?.format === 'visual-code-editor-project'
          ? parsedProject.state
          : parsedProject?.sprites
            ? parsedProject
            : null;

    if (!normalizedSharedState) {
      throw new Error('Shared link does not contain a valid project.');
    }

    applyProjectState(normalizedSharedState);
    return true;
  }, [applyProjectState, ensureLZStringLoaded]);

  useEffect(() => {
    if (hasRestoredSharedProjectRef.current) {
      return;
    }

    let isCancelled = false;
    hasRestoredSharedProjectRef.current = true;

    void restoreProjectFromHash()
      .then((didRestore) => {
        if (!isCancelled && didRestore) {
          showToast('Shared project loaded.');
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          showToast(error.message || 'Unable to open the shared project.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [restoreProjectFromHash, showToast]);

  useEffect(() => {
    const handleHashChange = () => {
      void restoreProjectFromHash().catch(() => undefined);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [restoreProjectFromHash]);

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

  const handleShareProject = useCallback(async () => {
    try {
      const lzString = await ensureLZStringLoaded();
      const compressedProject = lzString.compressToEncodedURIComponent(
        JSON.stringify(getShareProjectState())
      );

      if (!compressedProject) {
        throw new Error('Unable to create a share link for this project.');
      }

      const sharedUrl = `${window.location.origin}${window.location.pathname}${window.location.search}#${compressedProject}`;
      window.history.replaceState(null, '', `#${compressedProject}`);
      await navigator.clipboard.writeText(sharedUrl);
      showToast('Link copied to clipboard!', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to share this project.');
    }
  }, [ensureLZStringLoaded, getShareProjectState, showToast]);

  const loadProjectFile = useCallback(
    async (file) => {
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
    },
    [applyProjectState, showToast]
  );

  const handleLoadProject = useCallback(() => {
    projectFileInputRef.current?.click();
  }, []);

  const handleProjectFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      void loadProjectFile(file);
    },
    [loadProjectFile]
  );

  const handleAddSprite = useCallback(
    (librarySprite) => {
      const nextSprite = createSpriteInstance(librarySprite);
      setSprites((prevSprites) => [...prevSprites, nextSprite]);
      setSelectedSpriteId(nextSprite.id);
      setActiveSidebarTab('sprite');
      setIsSpriteLibraryOpen(false);
      setIsBackdropLibraryOpen(false);
      showToast(`${librarySprite.name} added.`);
    },
    [showToast]
  );

  const openSpriteLibrary = useCallback(() => {
    setIsBackdropLibraryOpen(false);
    setIsSpriteLibraryOpen(true);
  }, []);

  const openBackdropLibrary = useCallback(() => {
    setIsSpriteLibraryOpen(false);
    setIsBackdropLibraryOpen(true);
  }, []);

  const closeLibraries = useCallback(() => {
    setIsSpriteLibraryOpen(false);
    setIsBackdropLibraryOpen(false);
  }, []);

  const openSpriteUploadPicker = useCallback(() => {
    spriteFileInputRef.current?.click();
  }, []);

  const openBackdropUploadPicker = useCallback(() => {
    backdropFileInputRef.current?.click();
  }, []);

  const handleSpriteUpload = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (!file) return;

      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

      if (!isSvg) {
        showToast('Upload an SVG sprite file. Raster screenshots are not supported here.');
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const spriteSrc = typeof reader.result === 'string' ? reader.result : '';

        if (!spriteSrc) {
          showToast('Unable to read that sprite file.');
          return;
        }

        const uploadedSprite = {
          id: `uploaded-sprite-${Date.now()}`,
          name: file.name.replace(/\.[^.]+$/, '') || 'Uploaded Sprite',
          src: spriteSrc,
          color: '#FFAB19',
          type: 'uploaded',
        };

        setSpriteLibrary((prevSprites) => [...prevSprites, uploadedSprite]);
        handleAddSprite(uploadedSprite);
      };

      reader.onerror = () => {
        showToast('Unable to read that sprite file.');
      };

      reader.readAsDataURL(file);
    },
    [handleAddSprite, showToast]
  );

  const handleRemoveSprite = useCallback(
    (spriteId) => {
      setSprites((prevSprites) => {
        if (prevSprites.length <= 1) {
          showToast('Keep at least one sprite in the project.');
          return prevSprites;
        }

        return prevSprites.filter((sprite) => sprite.id !== spriteId);
      });
    },
    [showToast]
  );

  const handleSelectBackdrop = useCallback(
    (nextBackdropId) => {
      setBackdropValue(String(nextBackdropId));
      setActiveSidebarTab('backdrops');
      showToast('Initial backdrop updated.');
    },
    [setBackdropValue, showToast]
  );

  const handleAddBackdropToSession = useCallback(
    (libraryBackdrop) => {
      setSessionBackdrops((prevBackdrops) => {
        if (prevBackdrops.some((backdrop) => String(backdrop.id) === String(libraryBackdrop.id))) {
          return prevBackdrops;
        }

        return [...prevBackdrops, libraryBackdrop];
      });
      showToast(`${libraryBackdrop.name} added to session backdrops.`);
    },
    [setSessionBackdrops, showToast]
  );

  const handleApplySpriteMarkup = useCallback(
    (nextMarkup = spriteEditorMarkup) => {
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
    },
    [selectedSprite, showToast, spriteEditorMarkup, updateSpriteById]
  );

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

  const handleSelectedSpriteSizeChange = useCallback(
    (nextSize) => {
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
    },
    [selectedSprite, updateSpriteById]
  );

  useEffect(() => {
    if (
      selectedReplayBlockId &&
      replayableBlocks.some((block) => block.id === selectedReplayBlockId)
    ) {
      return;
    }

    setSelectedReplayBlockId(replayableBlocks[0]?.id || '');
  }, [replayableBlocks, selectedReplayBlockId]);

  useEffect(() => {
    if (selectedBlockId && findBlockById(blocks, selectedBlockId)) {
      return;
    }

    setSelectedBlockId('');
  }, [blocks, selectedBlockId]);

  useEffect(() => {
    if (isSpriteLibraryOpen) {
      window.setTimeout(() => spriteLibrarySearchRef.current?.focus(), 0);
    }
  }, [isSpriteLibraryOpen]);

  useEffect(() => {
    if (isBackdropLibraryOpen) {
      window.setTimeout(() => backdropLibrarySearchRef.current?.focus(), 0);
    }
  }, [isBackdropLibraryOpen]);

  useEffect(() => {
    document.body.style.overflow = isSpriteLibraryOpen || isBackdropLibraryOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isBackdropLibraryOpen, isSpriteLibraryOpen]);

  useEffect(
    () => () => {
      removalTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    },
    []
  );

  const handleSidebarBlockChange = useCallback((id, action, value) => {
    setSidebarBlocks((prevBlocks) =>
      prevBlocks.map((block) => (block.id === id ? { ...block, value } : block))
    );
  }, []);

  useEffect(() => {
    setSidebarBlocks((prevBlocks) =>
      prevBlocks.map((block) => {
        if (block.type !== VARIABLES || isVariableReporterAction(block.action)) {
          return block;
        }

        if (
          block.action === actionTypes.SET_VARIABLE_TO ||
          block.action === actionTypes.CHANGE_VARIABLE_BY
        ) {
          const nextVariableName = variableNames.includes(block.value.variableName)
            ? block.value.variableName
            : variableNames[0] || '';
          return {
            ...block,
            value: {
              ...block.value,
              variableName: nextVariableName,
            },
          };
        }

        const nextListName = listNames.includes(block.value.listName)
          ? block.value.listName
          : listNames[0] || '';
        return {
          ...block,
          value: {
            ...block.value,
            listName: nextListName,
          },
        };
      })
    );
  }, [listNames, variableNames]);

  const handleDrop = useCallback(
    (item) => {
      if (item.isWorkspaceBlock) {
        if (item.parentId) {
          mutateSelectedSpriteBlocks((prevBlocks) => {
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
      mutateSelectedSpriteBlocks((prevBlocks) => [...prevBlocks, newBlock]);
      setSelectedReplayBlockId((currentId) => currentId || newBlock.id);
      setRecentlyAddedBlockIds((prevIds) => [...prevIds, newBlock.id]);
      showToast('Block added.', 'info');
      const timeoutId = window.setTimeout(() => {
        setRecentlyAddedBlockIds((prevIds) => prevIds.filter((blockId) => blockId !== newBlock.id));
      }, 320);
      removalTimeoutsRef.current.push(timeoutId);
    },
    [mutateSelectedSpriteBlocks, showToast]
  );

  const moveBlock = useCallback(
    (fromIndex, toIndex) => {
      mutateSelectedSpriteBlocks((prevBlocks) => {
        const nextBlocks = [...prevBlocks];
        const [movedBlock] = nextBlocks.splice(fromIndex, 1);

        if (!movedBlock) {
          return prevBlocks;
        }

        nextBlocks.splice(toIndex, 0, movedBlock);
        return nextBlocks;
      });
    },
    [mutateSelectedSpriteBlocks]
  );

  const handleBlockChange = useCallback(
    (id, action, value) => {
      mutateSelectedSpriteBlocks((prevBlocks) =>
        prevBlocks.map((block) => (block.id === id ? { ...block, value } : block))
      );
    },
    [mutateSelectedSpriteBlocks]
  );

  const handleNestedBlockChange = useCallback(
    (id, action, value) => {
      mutateSelectedSpriteBlocks((prevBlocks) => updateBlockValueById(prevBlocks, id, value));
    },
    [mutateSelectedSpriteBlocks]
  );

  const handleRemoveBlock = useCallback(
    (id) => {
      mutateSelectedSpriteBlocks((prevBlocks) => removeBlockById(prevBlocks, id));
      setSelectedReplayBlockId((currentId) => (currentId === id ? '' : currentId));
      setSelectedBlockId((currentId) => (currentId === id ? '' : currentId));
    },
    [mutateSelectedSpriteBlocks]
  );

  const requestRemoveBlock = useCallback(
    (id) => {
      setRemovingBlockIds((prevIds) => prevIds.filter((blockId) => blockId !== id));
      handleRemoveBlock(id);
    },
    [handleRemoveBlock]
  );

  const handleNestedDrop = useCallback(
    (parentId, item, branchName = 'children') => {
      if (
        item.id === parentId ||
        isEventTriggerAction(item.action) ||
        isOperatorAction(item.action)
      ) {
        return;
      }

      mutateSelectedSpriteBlocks((prevBlocks) => {
        const existingBlock = item.isWorkspaceBlock ? findBlockById(prevBlocks, item.id) : null;
        const childBlock = existingBlock
          ? { ...existingBlock, id: `${Date.now()}-${Math.random()}` }
          : createWorkspaceBlock(item);

        const blocksWithoutMovedBlock = item.isWorkspaceBlock
          ? removeBlockById(prevBlocks, item.id)
          : prevBlocks;

        return appendChildBlock(blocksWithoutMovedBlock, parentId, childBlock, branchName);
      });
    },
    [mutateSelectedSpriteBlocks]
  );

  const handleOperatorSlotChange = useCallback(
    (id, slotName, slotValue) => {
      mutateSelectedSpriteBlocks((prevBlocks) =>
        updateOperatorSlotById(prevBlocks, id, slotName, slotValue)
      );
    },
    [mutateSelectedSpriteBlocks]
  );

  const handleOperatorSlotDrop = useCallback(
    (id, slotName, item) => {
      if (item.id === id || !isOperatorAction(item.action)) {
        return;
      }

      mutateSelectedSpriteBlocks((prevBlocks) => {
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
    },
    [mutateSelectedSpriteBlocks]
  );

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
    const alreadyExists = existingNames.some(
      (name) => name.toLowerCase() === trimmedName.toLowerCase()
    );

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

    setSidebarBlocks((prevBlocks) => [
      ...prevBlocks,
      {
        id: `sidebar-${variableModalType}-${Date.now()}-${Math.random()}`,
        type: VARIABLES,
        action:
          variableModalType === 'variable'
            ? actionTypes.VARIABLE_REPORTER
            : actionTypes.LIST_REPORTER,
        value: { name: trimmedName },
      },
    ]);
    closeVariableModal();
  }, [
    closeVariableModal,
    listNames,
    pendingVariableName,
    showToast,
    variableModalType,
    variableNames,
  ]);

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

    setSidebarBlocks((prevBlocks) =>
      prevBlocks.filter((block) => {
        if (entityType === 'variable') {
          return !(
            block.type === VARIABLES &&
            block.action === actionTypes.VARIABLE_REPORTER &&
            block.value?.name === entityName
          );
        }

        return !(
          block.type === VARIABLES &&
          block.action === actionTypes.LIST_REPORTER &&
          block.value?.name === entityName
        );
      })
    );

    setSprites((prevSprites) =>
      prevSprites.map((sprite) => ({
        ...sprite,
        blocks: removeVariableReporterBlocks(sprite.blocks || [], entityType, entityName),
      }))
    );
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
            [variableName]:
              (Number.isNaN(currentValue) ? 0 : currentValue) + (Number.isNaN(amount) ? 0 : amount),
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
        return (
          toNumber(resolveOperand(block.value?.left)) + toNumber(resolveOperand(block.value?.right))
        );
      case actionTypes.OPERATOR_SUBTRACT:
        return (
          toNumber(resolveOperand(block.value?.left)) - toNumber(resolveOperand(block.value?.right))
        );
      case actionTypes.OPERATOR_MULTIPLY:
        return (
          toNumber(resolveOperand(block.value?.left)) * toNumber(resolveOperand(block.value?.right))
        );
      case actionTypes.OPERATOR_DIVIDE:
        return (
          toNumber(resolveOperand(block.value?.left)) / toNumber(resolveOperand(block.value?.right))
        );
      case actionTypes.OPERATOR_MODULO:
        return (
          toNumber(resolveOperand(block.value?.left)) % toNumber(resolveOperand(block.value?.right))
        );
      case actionTypes.OPERATOR_LESS_THAN:
        return resolveOperand(block.value?.left) < resolveOperand(block.value?.right);
      case actionTypes.OPERATOR_EQUALS:
        return resolveOperand(block.value?.left) === resolveOperand(block.value?.right);
      case actionTypes.OPERATOR_GREATER_THAN:
        return resolveOperand(block.value?.left) > resolveOperand(block.value?.right);
      case actionTypes.OPERATOR_AND:
        return (
          toTruthiness(resolveOperand(block.value?.left)) &&
          toTruthiness(resolveOperand(block.value?.right))
        );
      case actionTypes.OPERATOR_OR:
        return (
          toTruthiness(resolveOperand(block.value?.left)) ||
          toTruthiness(resolveOperand(block.value?.right))
        );
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
          case 'abs':
            return Math.abs(operand);
          case 'floor':
            return Math.floor(operand);
          case 'ceiling':
            return Math.ceil(operand);
          case 'sqrt':
            return Math.sqrt(operand);
          case 'sin':
            return Math.sin((operand * Math.PI) / 180);
          case 'cos':
            return Math.cos((operand * Math.PI) / 180);
          case 'tan':
            return Math.tan((operand * Math.PI) / 180);
          case 'asin':
            return (Math.asin(operand) * 180) / Math.PI;
          case 'acos':
            return (Math.acos(operand) * 180) / Math.PI;
          case 'atan':
            return (Math.atan(operand) * 180) / Math.PI;
          case 'ln':
            return Math.log(operand);
          case 'log':
            return Math.log10(operand);
          case 'e^':
            return Math.exp(operand);
          case '10^':
            return 10 ** operand;
          default:
            return operand;
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

  const evaluateCondition = useCallback(
    (conditionValue) => {
      if (
        conditionValue &&
        typeof conditionValue === 'object' &&
        conditionValue.type === OPERATORS
      ) {
        return toTruthiness(evaluateOperatorBlock(conditionValue));
      }

      return toTruthiness(conditionValue);
    },
    [evaluateOperatorBlock]
  );

  const executeControlAction = useCallback(
    async (block, runNestedBlockList, waitForMs, shouldAbort) => {
      switch (block.action) {
        case actionTypes.WAIT_SECONDS:
          await waitForMs(Math.max(0, toNumber(block.value)) * 1000);
          break;
        case actionTypes.REPEAT_TIMES: {
          const repeatCount = Math.max(0, Math.floor(toNumber(block.value?.times)));
          for (let index = 0; index < repeatCount; index += 1) {
            if (shouldAbort()) {
              break;
            }
            await runNestedBlockList(block.children || []);
          }
          break;
        }
        case actionTypes.FOREVER:
          for (let index = 0; index < 100; index += 1) {
            if (shouldAbort()) {
              break;
            }
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
            if (!(await waitForMs(100))) {
              break;
            }
          }
          break;
        case actionTypes.REPEAT_UNTIL:
          while (!evaluateCondition(block.value?.condition)) {
            if (shouldAbort()) {
              break;
            }
            await runNestedBlockList(block.children || []);
          }
          break;
        default:
          break;
      }
    },
    [evaluateCondition]
  );

  const getPointerSpritePosition = useCallback((event) => {
    const preview = previewRef.current;
    if (!preview) return null;

    const previewRect = preview.getBoundingClientRect();

    return {
      x: event.clientX - previewRect.left - previewRect.width / 2 - spriteDragRef.current.offsetX,
      y: event.clientY - previewRect.top - previewRect.height / 2 - spriteDragRef.current.offsetY,
    };
  }, []);

  const handleSpritePointerDown = useCallback(
    (event) => {
      if (isRunning || event.button > 0) return;

      const preview = previewRef.current;
      if (!preview) return;

      const previewRect = preview.getBoundingClientRect();
      spriteDragRef.current = {
        isDragging: true,
        hasMoved: false,
        offsetX: event.clientX - previewRect.left - previewRect.width / 2 - spriteState.x,
        offsetY: event.clientY - previewRect.top - previewRect.height / 2 - spriteState.y,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [isRunning, spriteState.x, spriteState.y]
  );

  const handleSpritePointerMove = useCallback(
    (event) => {
      if (!spriteDragRef.current.isDragging) return;

      const nextPosition = getPointerSpritePosition(event);
      if (!nextPosition) return;

      spriteDragRef.current.hasMoved = true;

      setSelectedSpriteState((prevState) => ({
        ...prevState,
        x: nextPosition.x,
        y: nextPosition.y,
      }));
    },
    [getPointerSpritePosition, setSelectedSpriteState]
  );

  const handleSpritePointerUp = useCallback((event) => {
    if (!spriteDragRef.current.isDragging) return;

    spriteDragRef.current.isDragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const runBlockListForSprite = useCallback(
    async (sessionId, spriteId, blockList) => {
      const shouldAbort = () => isSpriteRunAborted(sessionId, spriteId);
      const waitForMs = (ms) => abortablePause(ms, sessionId, spriteId);
      const setSpriteStateForId = (nextState) =>
        updateSpriteById(spriteId, (sprite) => ({
          ...sprite,
          spriteState: typeof nextState === 'function' ? nextState(sprite.spriteState) : nextState,
        }));
      const setSpriteColorForId = (nextColor) =>
        updateSpriteById(spriteId, (sprite) => ({
          ...sprite,
          color: typeof nextColor === 'function' ? nextColor(sprite.color) : nextColor,
        }));
      const setSpeechBubbleForId = (nextBubble) => setSpriteSpeechBubble(spriteId, nextBubble);

      for (const block of blockList) {
        if (shouldAbort()) {
          return;
        }

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
            if (!(await waitForMs(BLOCK_STEP_DELAY_MS))) {
              return;
            }
          }
          continue;
        }

        if (block.type === CONTROLS) {
          await executeControlAction(
            block,
            (nestedBlocks) => runBlockListForSprite(sessionId, spriteId, nestedBlocks),
            waitForMs,
            shouldAbort
          );
          if (shouldAbort()) {
            return;
          }
          if (shouldApplyStepDelay(block)) {
            if (!(await waitForMs(BLOCK_STEP_DELAY_MS))) {
              return;
            }
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
          (message) => triggerBroadcastListenersRef.current(message),
          {
            shouldAbort,
            waitForMs,
          }
        );
        if (shouldAbort()) {
          return;
        }
        if (shouldApplyStepDelay(block)) {
          if (!(await waitForMs(BLOCK_STEP_DELAY_MS))) {
            return;
          }
        }
      }
    },
    [
      abortablePause,
      executeAction,
      executeControlAction,
      executeVariableAction,
      isSpriteRunAborted,
      setBackdropValue,
      setSpriteSpeechBubble,
      sounds,
      soundVolume,
      updateSpriteById,
    ]
  );

  const runMatchingEventBlocks = useCallback(
    (predicate, spritePredicate = () => true) => {
      const sessionId = runSessionRef.current.id;
      const eventRuns = spritesRef.current
        .filter(spritePredicate)
        .flatMap((sprite) =>
          (sprite.blocks || [])
            .filter((block) => isEventTriggerAction(block.action) && predicate(block))
            .map((block) => runBlockListForSprite(sessionId, sprite.id, block.children || []))
        );

      return Promise.all(eventRuns);
    },
    [runBlockListForSprite]
  );

  useEffect(() => {
    triggerBroadcastListenersRef.current = (message) => {
      const normalizedMessage = String(message || '').trim();

      if (!normalizedMessage) {
        return Promise.resolve();
      }

      return runMatchingEventBlocks(
        (block) =>
          block.action === actionTypes.WHEN_I_RECEIVE &&
          String(block.value || '').trim() === normalizedMessage
      );
    };
  }, [runMatchingEventBlocks]);

  const runCode = useCallback(async () => {
    if (isRunning) return;
    const sessionId = runSessionRef.current.id + 1;
    runSessionRef.current = { id: sessionId, stoppedSprites: new Set() };
    clearAllSpriteSpeechBubbles();
    setIsRunning(true);
    setHasDismissedRunNudge(true);
    showToast('Running code...', 'info');

    try {
      await Promise.all(
        sprites.map((sprite) =>
          runBlockListForSprite(
            sessionId,
            sprite.id,
            (sprite.blocks || []).filter((block) => !isEventTriggerAction(block.action))
          )
        )
      );
    } finally {
      setIsRunning(false);
      clearAllSpriteSpeechBubbles();
    }
  }, [clearAllSpriteSpeechBubbles, isRunning, runBlockListForSprite, showToast, sprites]);

  useEffect(() => {
    const handleEditorShortcuts = (event) => {
      const isUndoShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z';

      if (isUndoShortcut) {
        const spriteId = activeSpriteId;
        const historyEntries = blockHistoryRef.current[spriteId] || [];

        if (historyEntries.length > 0) {
          event.preventDefault();
          const previousBlocks = historyEntries[historyEntries.length - 1];
          blockHistoryRef.current[spriteId] = historyEntries.slice(0, -1);
          mutateSelectedSpriteBlocks(() => cloneBlocks(previousBlocks), { recordHistory: false });
          setSelectedBlockId('');
        }
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedBlockId) {
        const target = event.target;
        const isTypingField =
          target instanceof HTMLElement &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

        if (!isTypingField) {
          event.preventDefault();
          requestRemoveBlock(selectedBlockId);
        }
      }
    };

    window.addEventListener('keydown', handleEditorShortcuts);

    return () => {
      window.removeEventListener('keydown', handleEditorShortcuts);
    };
  }, [activeSpriteId, mutateSelectedSpriteBlocks, requestRemoveBlock, selectedBlockId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      runMatchingEventBlocks(
        (block) => block.action === actionTypes.WHEN_KEY_PRESSED && block.value === event.code
      );
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

    runMatchingEventBlocks(
      (block) =>
        block.action === actionTypes.WHEN_BACKDROP_SWITCHES_TO &&
        String(block.value) === String(backdropValue)
    );
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

  const replaySelectedBlock = useCallback(async (blockOverride = null) => {
    const blockToReplay = blockOverride || selectedReplayBlock;

    if (!blockToReplay) {
      showToast('Add a non-event block to replay.');
      return;
    }

    const sessionId = runSessionRef.current.id + 1;
    runSessionRef.current = { id: sessionId, stoppedSprites: new Set() };
    setIsRunning(true);

    try {
      await runBlockListForSprite(sessionId, activeSpriteId, [blockToReplay]);
      showToast(`Replayed ${describeBlock(blockToReplay)}.`);
    } finally {
      setIsRunning(false);
    }
  }, [activeSpriteId, runBlockListForSprite, selectedReplayBlock, showToast]);

  const stopCurrentSprite = useCallback(() => {
    if (!isRunning || !activeSpriteId) {
      return;
    }

    runSessionRef.current.stoppedSprites.add(activeSpriteId);
    setSpriteSpeechBubble(activeSpriteId, { message: '', isThinking: false });
    showToast('Current sprite stopped.');
  }, [activeSpriteId, isRunning, setSpriteSpeechBubble, showToast]);

  const stopAllCode = useCallback(() => {
    if (!isRunning) {
      return;
    }

    runSessionRef.current = {
      id: runSessionRef.current.id + 1,
      stoppedSprites: new Set(),
    };
    stopAllActiveSounds();
    clearAllSpriteSpeechBubbles();
    setIsRunning(false);
    showToast('Stopped all running code.');
  }, [clearAllSpriteSpeechBubbles, isRunning, showToast, stopAllActiveSounds]);

  const handleBackdropMenuAction = useCallback((id, action, onChange) => {
    pendingBackdropChangeRef.current = { id, action, onChange };
    backdropFileInputRef.current?.click();
  }, []);

  const handleBackdropUpload = useCallback(
    (event) => {
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

        setBackdropLibrary((prevBackdrops) => [...prevBackdrops, uploadedBackdrop]);
        setSessionBackdrops((prevBackdrops) => [...prevBackdrops, uploadedBackdrop]);

        if (pendingChange) {
          pendingChange.onChange(pendingChange.id, pendingChange.action, uploadedBackdrop.id);
          pendingBackdropChangeRef.current = null;
        }
      };

      reader.readAsDataURL(file);
    },
    [setSessionBackdrops]
  );

  useEffect(() => {
    sessionBackdropsRef.current = sessionBackdrops.filter(
      (backdrop) => backdrop.type === 'uploaded'
    );
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

  useEffect(
    () => () => {
      toastTimeoutRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      toastTimeoutRef.current = [];
    },
    []
  );

  useEffect(() => {
    const hasUnsavedChanges =
      sprites.some((sprite) => (sprite.blocks || []).length > 0) ||
      sessionBackdrops.length > 1 ||
      sounds.some(({ type }) => type === 'recorded');

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
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
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
      <div
        className={`editor-surface flex h-full min-h-0 flex-col ${isDarkMode ? 'theme-dark' : ''}`}
      >
        <nav className="navbar grid h-16 flex-shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-sky-900/60 bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 px-4 shadow-sm">
          <div className="flex min-w-0 flex-wrap items-center gap-1 justify-self-start">
            <div ref={fileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsAssetsMenuOpen(false);
                  setIsFileMenuOpen((open) => !open);
                }}
                className="topbar-action flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-white/10 hover:text-white"
                aria-expanded={isFileMenuOpen}
                aria-haspopup="menu"
              >
                <FileText size={16} strokeWidth={1.5} className="current-color-icon" />
                File
                <ChevronDown
                  size={14}
                  className={`transition ${isFileMenuOpen ? 'rotate-180' : ''}`}
                />
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
                    <Save size={16} strokeWidth={1.5} className="current-color-icon text-blue-600" />
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
                    <Upload size={16} strokeWidth={1.5} className="current-color-icon text-blue-600" />
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
                className="topbar-action flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-white/10 hover:text-white"
                aria-expanded={isAssetsMenuOpen}
                aria-haspopup="menu"
              >
                <FolderOpen size={16} strokeWidth={1.5} className="current-color-icon" />
                Assets
                <ChevronDown
                  size={14}
                  className={`transition ${isAssetsMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isAssetsMenuOpen && (
                <div className="absolute left-0 top-12 z-20 w-56 rounded-xl border border-sky-900/20 bg-white py-1.5 text-sm shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssetsMenuOpen(false);
                      openSpriteLibrary();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50"
                  >
                    <Shapes size={16} strokeWidth={1.5} className="current-color-icon text-orange-500" />
                    Sprite Library
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssetsMenuOpen(false);
                      openBackdropLibrary();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50"
                  >
                    <ImageIcon size={16} strokeWidth={1.5} className="current-color-icon text-emerald-600" />
                    Backdrop Library
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFileMenuOpen(false);
                setIsAssetsMenuOpen(false);
                void handleShareProject();
              }}
              className="topbar-action flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-white/10 hover:text-white"
            >
              <Link2 size={16} strokeWidth={1.5} className="current-color-icon" />
              Share
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode((current) => !current)}
              className="topbar-action flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-white/10 hover:text-white"
            >
              {isDarkMode ? <Sun size={16} strokeWidth={1.5} className="current-color-icon" /> : <Moon size={16} strokeWidth={1.5} className="current-color-icon" />}
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 shadow-sm backdrop-blur-sm">
              {selectedSprite && (
                <div ref={spriteSelectorRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBackdropSelectorOpen(false);
                      setIsSpriteSelectorOpen((open) => !open);
                    }}
                    className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-orange-900 shadow-sm"
                  >
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden">
                      <SpriteGraphic
                        src={selectedSprite.src}
                        markup={selectedSprite.svgMarkup}
                        color={selectedSprite.color}
                        width="14"
                        height="14"
                        className="block"
                      />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                      Sprite
                    </span>
                    <span className="max-w-28 truncate text-sm font-semibold">
                      {selectedSprite.name}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition ${isSpriteSelectorOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <FloatingDropdownMenu
                    isOpen={isSpriteSelectorOpen}
                    triggerRef={spriteSelectorRef}
                    width={200}
                  >
                    {sprites.map((sprite) => (
                      <button
                        key={sprite.id}
                        type="button"
                        onClick={() => {
                          setSelectedSpriteId(sprite.id);
                          setIsSpriteSelectorOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-orange-50 ${
                          activeSpriteId === sprite.id
                            ? 'bg-orange-100 font-semibold text-orange-800'
                            : 'text-gray-800'
                        }`}
                      >
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden">
                          <SpriteGraphic
                            src={sprite.src}
                            markup={sprite.svgMarkup}
                            color={sprite.color}
                            width="14"
                            height="14"
                            className="block"
                          />
                        </div>
                        <span className="truncate">{sprite.name}</span>
                      </button>
                    ))}
                  </FloatingDropdownMenu>
                </div>
              )}
              {selectedBackdrop && (
                <div ref={backdropSelectorRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSpriteSelectorOpen(false);
                      setIsBackdropSelectorOpen((open) => !open);
                    }}
                    className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-emerald-900 shadow-sm"
                  >
                    <BackdropSwatch backdrop={selectedBackdrop} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Backdrop
                    </span>
                    <span className="max-w-28 truncate text-sm font-semibold">
                      {selectedBackdrop.name}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition ${isBackdropSelectorOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <FloatingDropdownMenu
                    isOpen={isBackdropSelectorOpen}
                    triggerRef={backdropSelectorRef}
                    width={220}
                  >
                    {availableBackdrops.map((backdrop) => (
                      <button
                        key={backdrop.id}
                        type="button"
                        onClick={() => {
                          handleSelectBackdrop(backdrop.id);
                          setIsBackdropSelectorOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-emerald-50 ${
                          String(backdrop.id) === String(backdropValue)
                            ? 'bg-emerald-100 font-semibold text-emerald-800'
                            : 'text-gray-800'
                        }`}
                      >
                        <BackdropSwatch backdrop={backdrop} />
                        <span className="truncate">{backdrop.name}</span>
                      </button>
                    ))}
                  </FloatingDropdownMenu>
                </div>
              )}
            </div>
          </div>
          <div className="justify-self-end">
            <h1 className="text-xl font-bold tracking-tight text-white">Visual Code Editor</h1>
          </div>
        </nav>
        <div className="flex min-h-0 flex-1">
          {/* Sidebar */}
          <div className="sidebar-shell flex w-1/4 flex-col px-2 py-4">
            <div className="mb-4 overflow-x-auto pb-1">
              <div className="inline-flex min-w-max items-center gap-2 px-0.5">
                <button
                  draggable="false"
                  onClick={() => setActiveSidebarTab('blocks')}
                  className={`tab-button flex flex-shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-semibold transition ${
                    activeSidebarTab === 'blocks'
                      ? 'tab-active'
                      : ''
                  }`}
                >
                  <span className="tab-icon-chip flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold">
                    {'</>'}
                  </span>
                  Code
                </button>
                <button
                  draggable="false"
                  onClick={() => setActiveSidebarTab('sprite')}
                  className={`tab-button flex flex-shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-semibold transition ${
                    activeSidebarTab === 'sprite'
                      ? 'tab-active'
                      : ''
                  }`}
                >
                  {selectedSprite ? (
                    <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-orange-200 bg-white">
                      <SpriteGraphic
                        src={selectedSprite.src}
                        markup={selectedSprite.svgMarkup}
                        color={selectedSprite.color}
                        width="14"
                        height="14"
                        className="block"
                      />
                    </span>
                  ) : null}
                  Sprite
                </button>
                <button
                  draggable="false"
                  onClick={() => setActiveSidebarTab('backdrops')}
                  className={`tab-button flex flex-shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-semibold transition ${
                    activeSidebarTab === 'backdrops'
                      ? 'tab-active'
                      : ''
                  }`}
                >
                  {selectedBackdrop ? (
                    <BackdropSwatch
                      backdrop={selectedBackdrop}
                      className="h-5 w-5 rounded-md border border-emerald-200"
                    />
                  ) : null}
                  Backdrops
                </button>
              </div>
            </div>

            <div
              className="overflow-x-auto overflow-y-auto pr-0"
              style={{ height: EDITOR_PANEL_HEIGHT, minHeight: EDITOR_PANEL_HEIGHT }}
            >
              {activeSidebarTab === 'blocks' && (
                <div className="sidebar-panel min-h-full rounded-xl border px-2 py-3 shadow-sm">
                  <h2 className="sidebar-section-heading mb-2 border-b pb-2 pt-2 text-lg font-bold">
                    Motion
                  </h2>
                  {sidebarBlocks
                    .filter((block) => block.type === MOTION)
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
                        onDeleteVariableEntity={handleDeleteVariableEntity}
                      />
                    ))}
                  <h2 className="sidebar-section-heading mb-2 mt-2 border-b pb-2 pt-2 text-lg font-bold">
                    Looks
                  </h2>
                  {sidebarBlocks
                    .filter((block) => block.type === LOOKS)
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
                        onDeleteVariableEntity={handleDeleteVariableEntity}
                      />
                    ))}
                  <h2 className="sidebar-section-heading mb-2 mt-2 border-b pb-2 pt-2 text-lg font-bold">
                    Sound
                  </h2>
                  {sidebarBlocks
                    .filter((block) => block.type === SOUND)
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
                        onDeleteVariableEntity={handleDeleteVariableEntity}
                      />
                    ))}
                  <h2 className="sidebar-section-heading mb-2 mt-2 border-b pb-2 pt-2 text-lg font-bold">
                    Events
                  </h2>
                  {sidebarBlocks
                    .filter((block) => block.type === EVENTS)
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
                        onDeleteVariableEntity={handleDeleteVariableEntity}
                      />
                    ))}
                  <h2 className="sidebar-section-heading mb-2 mt-2 border-b pb-2 pt-2 text-lg font-bold">
                    Control
                  </h2>
                  {sidebarBlocks
                    .filter((block) => block.type === CONTROLS)
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
                        onDeleteVariableEntity={handleDeleteVariableEntity}
                      />
                    ))}
                  <h2 className="sidebar-section-heading mb-2 mt-2 border-b pb-2 pt-2 text-lg font-bold">
                    Operators
                  </h2>
                  {sidebarBlocks
                    .filter((block) => block.type === OPERATORS)
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
                  <h2 className="sidebar-section-heading mb-2 mt-2 border-b pb-2 pt-2 text-lg font-bold">
                    Variables
                  </h2>
                  <div className="mb-2 ml-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={openVariableModal}
                      className="btn-create-variable w-36 rounded-lg border-2 border-orange-500 bg-transparent px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-500 hover:text-white"
                    >
                      Create Variable
                    </button>
                    <button
                      type="button"
                      onClick={openListModal}
                      className="btn-create-list w-36 rounded-lg border-2 border-orange-500 bg-transparent px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-500 hover:text-white"
                    >
                      Create List
                    </button>
                  </div>
                  {sidebarBlocks.filter((block) => block.type === VARIABLES).length === 0 && (
                    <div className="rounded bg-white px-3 py-2 text-sm text-gray-500">
                      Create a variable or list to get started.
                    </div>
                  )}
                  {sidebarBlocks
                    .filter(
                      (block) => block.type === VARIABLES && isVariableReporterAction(block.action)
                    )
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
                    .filter(
                      (block) => block.type === VARIABLES && !isVariableReporterAction(block.action)
                    )
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
                      onClick={openSpriteLibrary}
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
                          selectedSpriteId === sprite.id
                            ? 'border-orange-500 ring-2 ring-orange-200'
                            : 'border-gray-200'
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
                            <SpriteGraphic
                              src={sprite.src}
                              markup={sprite.svgMarkup}
                              color={sprite.color}
                              width="112"
                              height="112"
                              className="block"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-left text-xs text-gray-500">
                          {(sprite.blocks || []).length} blocks in workspace
                        </div>
                      </div>
                    ))}
                  </div>
                  {sidebarBlocks
                    .filter((block) => block.type === SPRITE)
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
                      onClick={openBackdropLibrary}
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
                            isActiveBackdrop
                              ? 'border-emerald-500 ring-2 ring-emerald-200'
                              : 'border-gray-200'
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
                              <span className="text-sm font-semibold text-gray-500">
                                White Space
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 px-3 py-3">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {backdrop.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {isActiveBackdrop
                                  ? 'Current initial backdrop'
                                  : 'Click to set as initial'}
                              </div>
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
            </div>
            <p className="text-center mb-2 font-semibold">
              {activeSidebarTab === 'sprite'
                ? selectedSprite
                  ? `${selectedSprite.name} sprite editor. Update the SVG and apply it to this sprite.`
                  : 'Add a sprite from the navbar to start building.'
                : selectedSprite
                  ? `${selectedSprite.name} workspace. Drag blocks here and press Run Code.`
                  : 'Add a sprite from the navbar to start building.'}
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
              <DroppableArea
                onDrop={handleDrop}
                onBackgroundClick={() => setSelectedBlockId('')}
                isEmpty={!hasBlocks}
                emptyState={
                  <div className="pointer-events-none text-center">
                    <div className="hint-circle">+</div>
                    <p className="empty-hint-text text-base font-medium">
                      Drag blocks here and press Run Code
                    </p>
                  </div>
                }
              >
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
                    selectedBlockId={selectedBlockId}
                    onSelect={setSelectedBlockId}
                    onRequestRemove={requestRemoveBlock}
                    removingBlockIds={removingBlockIds}
                    recentlyAddedBlockIds={recentlyAddedBlockIds}
                  />
                ))}
                {hasBlocks && !hasDismissedRunNudge && (
                  <div className="mt-1">
                    <span className="workspace-nudge">
                      Press Run Code
                    </span>
                  </div>
                )}
              </DroppableArea>
            )}
          </div>

          {/* Preview Area */}
          {!isPreviewExpanded && (
            <div className="w-3/6 border-l border-slate-200/80 p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="w-24" />
                <h1 className="text-xl font-bold text-center">Preview</h1>
                <Tooltip content="Fullscreen preview">
                  <button
                    type="button"
                    onClick={() => setIsPreviewExpanded(true)}
                    className="tooltip-trigger-button rounded border border-[var(--border-preview)] bg-white p-2 text-gray-800"
                    aria-label="Full screen preview"
                    title="Fullscreen preview"
                  >
                    <Maximize2 size={16} />
                  </button>
                </Tooltip>
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
                className="preview-surface relative overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 p-4"
              />
              <PreviewControls
                isRunning={isRunning}
                replayableBlocks={replayableBlocks}
                selectedReplayBlock={selectedReplayBlock}
                selectedReplayBlockId={selectedReplayBlockId}
                setSelectedReplayBlockId={setSelectedReplayBlockId}
                runCode={runCode}
                replaySelectedBlock={replaySelectedBlock}
                stopCurrentSprite={stopCurrentSprite}
                stopAllCode={stopAllCode}
                shouldPulseRun={!hasDismissedRunNudge}
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
                className="preview-surface relative overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 p-4"
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
                stopCurrentSprite={stopCurrentSprite}
                stopAllCode={stopAllCode}
                compact
                shouldPulseRun={!hasDismissedRunNudge}
              />
            </div>
          </div>
        )}
        {isSpriteLibraryOpen && (
          <div
            id="sprite-library"
            className="library-modal asset-modal"
            aria-hidden={!isSpriteLibraryOpen}
          >
            <div className="asset-modal-header library-header flex h-16 items-center justify-between border-b px-6">
              <div>
                <h1 className="asset-modal-title text-xl font-bold">Sprite Library</h1>
                <p className="asset-modal-subtitle text-sm">Choose a sprite to add to your project.</p>
              </div>
              <button
                type="button"
                onClick={closeLibraries}
                className="asset-modal-close rounded-full p-2 transition hover:bg-gray-200"
                aria-label="Close sprite library"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-full overflow-y-auto px-6 py-6">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-md">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    ref={spriteLibrarySearchRef}
                    type="text"
                    value={spriteLibrarySearch}
                    onChange={(event) => setSpriteLibrarySearch(event.target.value)}
                    placeholder={`Search ${spriteLibrary.length}+ sprites…`}
                    className="asset-search h-11 w-full rounded-xl border pl-10 pr-4 text-sm shadow-sm"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AssetCategoryDropdown
                    value={spriteCategoryFilter}
                    options={spriteCategoryOptions}
                    onChange={setSpriteCategoryFilter}
                    accentClassName="text-gray-700"
                    menuActiveClassName="bg-sky-100 font-semibold text-sky-800"
                  />
                  {[
                    { id: 'all', label: 'All', count: spriteLibrary.length },
                    {
                      id: 'added',
                      label: 'Added',
                      count: spriteLibrary.filter((librarySprite) =>
                        sprites.some(
                          (sprite) =>
                            sprite.libraryId === librarySprite.id ||
                            String(sprite.src || '') === String(librarySprite.src || '')
                        )
                      ).length,
                    },
                    {
                      id: 'not-added',
                      label: 'Not Added',
                      count: spriteLibrary.filter(
                        (librarySprite) =>
                          !sprites.some(
                            (sprite) =>
                              sprite.libraryId === librarySprite.id ||
                              String(sprite.src || '') === String(librarySprite.src || '')
                          )
                      ).length,
                    },
                  ].map((filterOption) => (
                    <button
                      key={filterOption.id}
                      type="button"
                      onClick={() => setSpriteLibraryFilter(filterOption.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        spriteLibraryFilter === filterOption.id
                          ? 'bg-sky-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {`${filterOption.label} ${filterOption.count}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
                <button
                  type="button"
                  onClick={openSpriteUploadPicker}
                  className="library-card upload-card rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50 p-4 text-left transition hover:border-sky-400 hover:bg-sky-100"
                >
                  <div className="upload-placeholder mb-3 flex items-center justify-center rounded-xl bg-white/70 text-sky-600">
                    <span className="text-5xl font-light leading-none">+</span>
                  </div>
                  <div className="text-sm font-semibold text-sky-900">Upload Local Sprite</div>
                  <div className="mt-1 text-xs text-sky-700">
                    Convert artwork to SVG first, then upload it here.
                  </div>
                  <Tooltip
                    content="Use an SVG export from Figma, Illustrator, or Inkscape. PNG and JPG won’t stay crisp as sprites."
                    position="bottom"
                  >
                    <span className="mt-3 inline-flex text-xs font-semibold text-sky-700 underline underline-offset-2">
                      How to convert →
                    </span>
                  </Tooltip>
                </button>
                {filteredSpriteLibrary.map((librarySprite) => (
                  <button
                    key={librarySprite.id}
                    type="button"
                    onClick={() => handleAddSprite(librarySprite)}
                    className="library-card sprite-thumb-hover sprite-card relative rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:shadow-md"
                    data-added={
                      sprites.some(
                        (sprite) =>
                          sprite.libraryId === librarySprite.id ||
                          String(sprite.src || '') === String(librarySprite.src || '')
                      )
                        ? 'true'
                        : 'false'
                    }
                  >
                    {sprites.some(
                      (sprite) =>
                        sprite.libraryId === librarySprite.id ||
                        String(sprite.src || '') === String(librarySprite.src || '')
                    ) ? (
                      <AddedBadge color="green" className="absolute right-3 top-3">
                        ✓ Added
                      </AddedBadge>
                    ) : null}
                    <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-gray-50">
                      <div className="sprite-thumb-image transition-transform duration-150 ease-out">
                        <SpriteGraphic
                          src={librarySprite.src}
                          color={librarySprite.color}
                          width="96"
                          height="96"
                          className="block"
                        />
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{librarySprite.name}</div>
                    <div className="mt-1 text-xs font-medium text-sky-700">
                      {getSpriteCategory(librarySprite)}
                    </div>
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
          <div
            id="backdrop-library"
            className="library-modal asset-modal"
            aria-hidden={!isBackdropLibraryOpen}
          >
            <div className="asset-modal-header library-header flex h-16 items-center justify-between border-b px-6">
              <div>
                <h1 className="asset-modal-title text-xl font-bold">Backdrop Library</h1>
                <p className="asset-modal-subtitle text-sm">
                  Choose backdrops to add to the current session.
                </p>
              </div>
              <button
                type="button"
                onClick={closeLibraries}
                className="asset-modal-close rounded-full p-2 transition hover:bg-gray-200"
                aria-label="Close backdrop library"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-full overflow-y-auto px-6 py-6">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-md">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    ref={backdropLibrarySearchRef}
                    type="text"
                    value={backdropLibrarySearch}
                    onChange={(event) => setBackdropLibrarySearch(event.target.value)}
                    placeholder={`Search ${backdropLibrary.length}+ backdrops…`}
                    className="asset-search h-11 w-full rounded-xl border pl-10 pr-4 text-sm shadow-sm"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AssetCategoryDropdown
                    value={backdropCategoryFilter}
                    options={backdropCategoryOptions}
                    onChange={setBackdropCategoryFilter}
                    accentClassName="text-gray-700"
                    menuActiveClassName="bg-emerald-100 font-semibold text-emerald-800"
                  />
                  {[
                    { id: 'all', label: 'All', count: backdropLibrary.length },
                    {
                      id: 'added',
                      label: 'Added',
                      count: backdropLibrary.filter((libraryBackdrop) =>
                        availableBackdrops.some(
                          (backdrop) => String(backdrop.id) === String(libraryBackdrop.id)
                        )
                      ).length,
                    },
                    {
                      id: 'not-added',
                      label: 'Not Added',
                      count: backdropLibrary.filter(
                        (libraryBackdrop) =>
                          !availableBackdrops.some(
                            (backdrop) => String(backdrop.id) === String(libraryBackdrop.id)
                          )
                      ).length,
                    },
                  ].map((filterOption) => (
                    <button
                      key={filterOption.id}
                      type="button"
                      onClick={() => setBackdropLibraryFilter(filterOption.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        backdropLibraryFilter === filterOption.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{`${filterOption.label} ${filterOption.count}`}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={openBackdropUploadPicker}
                  className="library-card upload-card rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-100"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                >
                  <div className="upload-placeholder mb-3 flex items-center justify-center rounded-xl bg-white/70 text-emerald-600">
                    <span className="text-5xl font-light leading-none">+</span>
                  </div>
                  <div className="text-sm font-semibold text-emerald-900">
                    Upload Local Backdrop
                  </div>
                  <div className="mt-1 text-xs text-emerald-700">
                    Add an image from your machine to this session.
                  </div>
                </button>
                {filteredBackdropLibrary.map((libraryBackdrop) => {
                  const isAdded = availableBackdrops.some(
                    (backdrop) => String(backdrop.id) === String(libraryBackdrop.id)
                  );

                  return (
                    <button
                      key={libraryBackdrop.id}
                      type="button"
                      onClick={() => handleAddBackdropToSession(libraryBackdrop)}
                      data-backdrop-id={libraryBackdrop.id}
                      className={`library-card backdrop-card backdrop-thumb-hover overflow-hidden rounded-2xl border bg-white text-left shadow-sm hover:shadow-md ${
                        isAdded
                          ? 'border-emerald-500 ring-2 ring-emerald-200'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div
                        className="library-card-image backdrop-thumb-image w-full bg-gray-50 transition-transform duration-150 ease-out"
                        data-is-white-bg={libraryBackdrop.id === 'white-space' ? 'true' : 'false'}
                        style={{
                          backgroundImage: libraryBackdrop.url
                            ? `url(${libraryBackdrop.url})`
                            : 'none',
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
                          <div className="text-sm font-semibold text-gray-900">
                            {libraryBackdrop.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isAdded ? 'Already in session' : 'Add to session'}
                          </div>
                          <div className="mt-1 text-xs font-medium text-emerald-700">
                            {getBackdropCategory(libraryBackdrop)}
                          </div>
                        </div>
                        {isAdded && <AddedBadge color="green">✓ Added</AddedBadge>}
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
          ref={spriteFileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          onChange={handleSpriteUpload}
          className="hidden"
        />
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
        {toasts.length > 0 && (
          <div id="toast-container" className="toast-container">
            {toasts.map((toast) => (
              <div key={toast.id} className={`toast toast-visible toast-${toast.type}`}>
                {toast.message}
              </div>
            ))}
          </div>
        )}
        {isVariableModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-[360px] max-w-[90vw] rounded-xl bg-white p-6 shadow-xl">
              <h2 className="mb-2 text-lg font-bold">
                {variableModalType === 'variable' ? 'Create Variable' : 'Create List'}
              </h2>
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
                  <p className="text-sm text-gray-600 mb-4">
                    Recording in progress. Stop when you are done.
                  </p>
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
                  <p className="text-sm text-gray-600 mb-4">
                    Recording captured. Save it to the sound list?
                  </p>
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
