import * as actionTypes from '../../constants/ActionTypes';
import { OPERATORS, VARIABLES } from '../../constants/BlockTypes';

export const DEFAULT_SOUNDS = [{ id: 'meow', name: 'Meow', type: 'builtin', url: '/sounds/Meow.mp3' }];
export const LZ_STRING_CDN_URL = 'https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js';
export const SPRITE_LIBRARY = [
  { id: 'cat', name: 'Cat', src: '/assets/sprites/cat.svg', color: '#FFAB19' },
  { id: 'sky-cat', name: 'Sky Cat', src: '/assets/sprites/cat.svg', color: '#38BDF8' },
  { id: 'mint-cat', name: 'Mint Cat', src: '/assets/sprites/cat.svg', color: '#34D399' },
  { id: 'rose-cat', name: 'Rose Cat', src: '/assets/sprites/cat.svg', color: '#FB7185' },
];
export const BACKDROP_LIBRARY = [
  { id: 'white-space', name: 'White Space', url: '', type: 'builtin' },
  { id: 'beach', name: 'Beach', url: '/assets/backdrops/beach1.png', type: 'builtin' },
  { id: 'forest', name: 'Forest', url: '/assets/backdrops/forest.png', type: 'builtin' },
  { id: 'city', name: 'City', url: '/assets/backdrops/city.png', type: 'builtin' },
  { id: 'space', name: 'Space', url: '/assets/backdrops/space', type: 'builtin' },
];
export const RECORD_SOUND_OPTION = '__record_sound__';
export const EDITOR_PANEL_HEIGHT = 'min(600px, calc(100vh - 14rem))';
export const EMPTY_BLOCKS = [];
export const DROPDOWN_MENU_MAX_HEIGHT = 176;
export const TUTORIAL_STORAGE_KEY = 'vce_tutorial_completed';
export const TUTORIAL_STEPS = [
  {
    id: 'drag-blocks',
    target: '.block-palette .block:first-of-type',
    title: 'Drag & drop code blocks',
    description:
      'Pick any block from this panel and drag it into the workspace. Stack blocks to build your program.',
    position: 'right',
  },
  {
    id: 'add-sprites',
    target: '.tab[data-tab="sprite"]',
    title: 'Add more sprites',
    description:
      'Click the Sprite tab to manage your characters. Open the sprite library from the Assets menu to add more.',
    position: 'bottom',
  },
  {
    id: 'add-backdrops',
    target: '.tab[data-tab="backdrops"]',
    title: 'Change the backdrop',
    description:
      'Click the Backdrops tab to set the scene. Choose a library backdrop or upload your own image.',
    position: 'bottom',
  },
  {
    id: 'run-code',
    target: '.btn-run-code',
    title: 'Run your code',
    description:
      'Press Run Code to bring your blocks to life and watch the preview react on the right.',
    position: 'top',
  },
  {
    id: 'save-load',
    target: '.navbar-file-btn',
    title: 'Save & load your project',
    description:
      'Click File to save your project for later or load a project you already saved.',
    position: 'bottom',
  },
];

export const SPRITE_CATEGORY_MAP = {
  Food: new Set(['apple', 'banana', 'bread', 'cake', 'donut', 'egg', 'milk', 'orange', 'salad', 'strawberry', 'taco', 'watermelon']),
  Animals: new Set(['bat', 'bear', 'butterfly', 'cat', 'chick', 'crab', 'dog', 'dove', 'duck', 'elephant', 'fish', 'fox', 'frog', 'giraffe', 'grasshopper', 'hare', 'hedgehog', 'hen', 'hippo', 'horse', 'jellyfish', 'ladybug', 'lion', 'llama', 'monkey', 'mouse', 'octopus', 'owl', 'panther', 'parrot', 'penguin', 'polarbear', 'rabbit', 'reindeer', 'rooster', 'shark', 'snake', 'starfish', 'toucan', 'zebra']),
  Fantasy: new Set(['dinosaur', 'dinosaur2', 'dinosaur3', 'dragon', 'dragonfly', 'griffin']),
  Sports: new Set(['baseball', 'basketball', 'soccer']),
  Music: new Set(['drum', 'guitar', 'keyboard', 'radio', 'speaker', 'trumpet', 'bell']),
  Objects: new Set(['bowl', 'foodtruck', 'glass', 'jar']),
};

export const BACKDROP_CATEGORY_MAP = {
  Basics: new Set(['white-space']),
  Nature: new Set(['beach', 'beach2', 'desert', 'farm', 'forest', 'grass', 'mountain', 'slopes', 'winter', 'woods']),
  City: new Set(['city', 'metro', 'night-city', 'urban']),
  Indoors: new Set(['bedroom1', 'bedroom2', 'bedroom3', 'hall', 'school']),
  Sports: new Set(['baseball', 'basketball', 'football', 'playground', 'pool']),
  Space: new Set(['galaxy', 'moon', 'space', 'space-city', 'space-city-2', 'space-ship']),
  Fantasy: new Set(['castle', 'jurassic', 'witchhouse']),
  Events: new Set(['concert', 'party']),
  Water: new Set(['underwater', 'underwater2']),
};

export const EVENT_TRIGGER_ACTIONS = [
  actionTypes.WHEN_KEY_PRESSED,
  actionTypes.WHEN_SPRITE_CLICKED,
  actionTypes.WHEN_BACKDROP_SWITCHES_TO,
  actionTypes.WHEN_LOUDNESS_GREATER_THAN,
  actionTypes.WHEN_I_RECEIVE,
];

export const CONTROL_CONTAINER_ACTIONS = [
  actionTypes.REPEAT_TIMES,
  actionTypes.FOREVER,
  actionTypes.IF_THEN,
  actionTypes.IF_THEN_ELSE,
  actionTypes.REPEAT_UNTIL,
];

export const OPERATOR_ACTIONS = [
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

export const BLOCK_STEP_DELAY_MS = 1000;
export const ROOT_SVG_STYLE = 'width:100%;height:100%;display:block;';

export const isEventTriggerAction = (action) => EVENT_TRIGGER_ACTIONS.includes(action);
export const isControlContainerAction = (action) => CONTROL_CONTAINER_ACTIONS.includes(action);
export const isOperatorAction = (action) => OPERATOR_ACTIONS.includes(action);
export const isVariableReporterAction = (action) =>
  action === actionTypes.VARIABLE_REPORTER || action === actionTypes.LIST_REPORTER;
export const shouldApplyStepDelay = (block) => !TIMED_ACTIONS.has(block?.action);

export const getSpriteCategory = (sprite) => {
  if (sprite?.type === 'uploaded') return 'My Uploads';
  const normalizedId = String(sprite?.id || sprite?.libraryId || '').toLowerCase();
  const match = Object.entries(SPRITE_CATEGORY_MAP).find(([, ids]) => ids.has(normalizedId));
  return match?.[0] || 'Objects';
};

export const getBackdropCategory = (backdrop) => {
  if (backdrop?.type === 'uploaded') return 'My Uploads';
  const normalizedId = String(backdrop?.id || '').toLowerCase();
  const match = Object.entries(BACKDROP_CATEGORY_MAP).find(([, ids]) => ids.has(normalizedId));
  return match?.[0] || 'Scenes';
};

export const describeBlock = (block) => {
  if (!block) return 'Unknown block';
  if (block.action === actionTypes.WHEN_KEY_PRESSED) return `when ${block.value} key pressed`;
  if (block.action === actionTypes.WHEN_BACKDROP_SWITCHES_TO) return `when backdrop switches to ${block.value}`;
  if (block.action === actionTypes.WHEN_I_RECEIVE) return `when I receive ${block.value}`;
  if (block.type === VARIABLES && block.value?.name) return `${block.action} ${block.value.name}`;
  return block.action;
};

export const cloneBlockValue = (value) => {
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

export const createSpriteInstance = (librarySprite) => ({
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

export const INITIAL_SPRITE = createSpriteInstance(SPRITE_LIBRARY[0]);

export const createWorkspaceBlock = (item) => ({
  id: `${Date.now()}-${Math.random()}`,
  type: item.type,
  action: item.action,
  value: cloneBlockValue(item.value),
  ...(isEventTriggerAction(item.action) || isControlContainerAction(item.action) ? { children: [] } : {}),
  ...(item.action === actionTypes.IF_THEN_ELSE ? { elseChildren: [] } : {}),
});

export const getOperatorSlotBlock = (slotValue) => {
  if (slotValue && typeof slotValue === 'object' && slotValue.type === OPERATORS) {
    return slotValue;
  }

  return null;
};

export const mapOperatorSlotBlocks = (value, mapper) => {
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

export const findBlockById = (blocksToSearch, blockId) => {
  for (const block of blocksToSearch) {
    if (block.id === blockId) return block;

    const childBlock = findBlockById(block.children || [], blockId);
    if (childBlock) return childBlock;

    const elseChildBlock = findBlockById(block.elseChildren || [], blockId);
    if (elseChildBlock) return elseChildBlock;

    const operatorSlotBlocks = Object.values(block.value || {}).map(getOperatorSlotBlock).filter(Boolean);
    const operatorSlotBlock = findBlockById(operatorSlotBlocks, blockId);
    if (operatorSlotBlock) return operatorSlotBlock;
  }

  return null;
};

export const blockContainsId = (block, blockId) => {
  if (!block) return false;
  if ((block.children || []).some((childBlock) => childBlock.id === blockId || blockContainsId(childBlock, blockId))) return true;
  if ((block.elseChildren || []).some((childBlock) => childBlock.id === blockId || blockContainsId(childBlock, blockId))) return true;
  return Object.values(block.value || {}).map(getOperatorSlotBlock).filter(Boolean).some((slotBlock) => slotBlock.id === blockId || blockContainsId(slotBlock, blockId));
};

export const removeBlockById = (blocksToUpdate, blockId) =>
  blocksToUpdate
    .filter((block) => block.id !== blockId)
    .map((block) => ({
      ...block,
      children: block.children ? removeBlockById(block.children, blockId) : block.children,
      elseChildren: block.elseChildren ? removeBlockById(block.elseChildren, blockId) : block.elseChildren,
      value: mapOperatorSlotBlocks(block.value, (slotBlock) =>
        slotBlock.id === blockId
          ? ''
          : {
              ...slotBlock,
              value: mapOperatorSlotBlocks(slotBlock.value, (nestedSlotBlock) => removeBlockById([nestedSlotBlock], blockId)[0] || ''),
            }
      ),
    }));

export const appendChildBlock = (blocksToUpdate, parentId, childBlock, branchName = 'children') =>
  blocksToUpdate.map((block) => {
    if (block.id === parentId) {
      return { ...block, [branchName]: [...(block[branchName] || []), childBlock] };
    }

    if (block.children) {
      return {
        ...block,
        children: appendChildBlock(block.children, parentId, childBlock, branchName),
        elseChildren: block.elseChildren ? appendChildBlock(block.elseChildren, parentId, childBlock, branchName) : block.elseChildren,
      };
    }

    return block;
  });

export const updateBlockValueById = (blocksToUpdate, blockId, value) =>
  blocksToUpdate.map((block) => {
    if (block.id === blockId) return { ...block, value };

    if (block.children) {
      return {
        ...block,
        children: updateBlockValueById(block.children, blockId, value),
        elseChildren: block.elseChildren ? updateBlockValueById(block.elseChildren, blockId, value) : block.elseChildren,
      };
    }

    return {
      ...block,
      value: mapOperatorSlotBlocks(block.value, (slotBlock) => updateBlockValueById([slotBlock], blockId, value)[0]),
    };
  });

export const updateOperatorSlotById = (blocksToUpdate, blockId, slotName, slotValue) =>
  blocksToUpdate.map((block) => ({
    ...block,
    ...(block.id === blockId
      ? {
          value: {
            ...block.value,
            [slotName]: slotValue,
          },
        }
      : {
          children: block.children ? updateOperatorSlotById(block.children, blockId, slotName, slotValue) : block.children,
          elseChildren: block.elseChildren ? updateOperatorSlotById(block.elseChildren, blockId, slotName, slotValue) : block.elseChildren,
          value: mapOperatorSlotBlocks(block.value, (slotBlock) => updateOperatorSlotById([slotBlock], blockId, slotName, slotValue)[0]),
        }),
  }));

export const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const cloneBlocks = (blocks) => JSON.parse(JSON.stringify(blocks || []));

export const normalizeSvgMarkup = (markup) => {
  if (!markup || !/<svg[\s>]/i.test(markup)) return markup;

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

export const getInitialTheme = () => {
  if (typeof window === 'undefined') return false;
  const savedTheme = window.localStorage.getItem('theme');
  const resolvedTheme = savedTheme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  return resolvedTheme === 'dark';
};

export const loadSvgMarkup = async (src) => {
  if (!src) return '';
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Unable to load sprite asset: ${src}`);
  const markup = await response.text();
  return normalizeSvgMarkup(markup);
};

export const toNumber = (value) => {
  const parsedValue = typeof value === 'number' ? value : parseFloat(value);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

export const toTruthiness = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value.trim().length > 0;
  }
  return Boolean(value);
};

export const removeVariableReporterBlocks = (blocksToUpdate, entityType, entityName) =>
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
      value: mapOperatorSlotBlocks(block.value, (slotBlock) => removeVariableReporterBlocks([slotBlock], entityType, entityName)[0] || ''),
    }));

export const getTutorialTooltipStyle = (position, rect) => {
  const gap = 16;
  const tooltipWidth = 300;
  const tooltipHeight = 180;
  let top;
  let left;

  switch (position) {
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + gap;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - gap;
      break;
    case 'bottom':
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case 'top':
    default:
      top = rect.top - tooltipHeight - gap;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
  }

  return {
    top: Math.max(12, Math.min(top, window.innerHeight - tooltipHeight - 12)),
    left: Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12)),
  };
};
