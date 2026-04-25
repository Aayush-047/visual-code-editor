import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Play, Rewind } from 'lucide-react';
import CatSprite from './CatSprite';
import Block from './Block';
import DroppableArea from './DroppableArea';
import SpeechBubble from './SpeechBubble';
import { EVENTS, MOTION, LOOKS, SOUND, SPRITE, CONTROLS, OPERATORS, VARIABLES } from '../constants/BlockTypes';
import { BACKDROPS } from '../data/BackDrops';
import useExecuteAction from '../hooks/useExecuteAction';
import * as actionTypes from '../constants/ActionTypes';

const DEFAULT_SOUNDS = [
  { id: 'meow', name: 'Meow', type: 'builtin', url: '/sounds/Meow.mp3' },
];

const DEFAULT_SPRITES = [
  { id: 'cat', name: 'Cat' },
];

const RECORD_SOUND_OPTION = '__record_sound__';
const EVENT_TRIGGER_ACTIONS = [
  actionTypes.WHEN_KEY_PRESSED,
  actionTypes.WHEN_SPRITE_CLICKED,
  actionTypes.WHEN_BACKDROP_SWITCHES_TO,
  actionTypes.WHEN_LOUDNESS_GREATER_THAN,
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

const isOperatorAction = (action) => OPERATOR_ACTIONS.includes(action);
const isVariableReporterAction = (action) => action === actionTypes.VARIABLE_REPORTER || action === actionTypes.LIST_REPORTER;

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
  const [blocks, setBlocks] = useState([]);
  const [history, setHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const spriteRef = useRef(null);
  const previewRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const spriteDragRef = useRef({ isDragging: false, hasMoved: false, offsetX: 0, offsetY: 0 });
  const backdropFileInputRef = useRef(null);
  const pendingBackdropChangeRef = useRef(null);
  const uploadedBackdropsRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const activeAudiosRef = useRef([]);
  const [spriteState, setSpriteState] = useState({ x: 0, y: 0, rotation: -90, size: 100 });
  const [isRunning, setIsRunning] = useState(false);
  const [isRecordingSound, setIsRecordingSound] = useState(false);
  const [spriteColor, setSpriteColor] = useState('#FFAB19');
  const [backdropValue, setBackdropValue] = useState('0');
  const [speechBubble, setSpeechBubble] = useState({ message: '', isThinking: false });
  const [broadcastMessage, setBroadcastMessage] = useState({ message: '', color: '#111111' });
  const [sounds, setSounds] = useState(DEFAULT_SOUNDS);
  const [soundVolume, setSoundVolume] = useState(100);
  const [uploadedBackdrops, setUploadedBackdrops] = useState([]);
  const [recordingModalState, setRecordingModalState] = useState('closed');
  const [pendingRecordedSound, setPendingRecordedSound] = useState(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [variableModalType, setVariableModalType] = useState('variable');
  const [pendingVariableName, setPendingVariableName] = useState('');
  const [variableNames, setVariableNames] = useState([]);
  const [listNames, setListNames] = useState([]);
  const [, setVariableValues] = useState({});
  const [, setListValues] = useState({});
  const [activeSidebarTab, setActiveSidebarTab] = useState('blocks');
  const [selectedSpriteId, setSelectedSpriteId] = useState('cat');
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
    { id: 'sidebar-change-backdrop', type: LOOKS, action: actionTypes.CHANGE_BACKDROP, value: 0 },
    { id: 'sidebar-hide', type: LOOKS, action: actionTypes.HIDE, value: null },
    { id: 'sidebar-show', type: LOOKS, action: actionTypes.SHOW, value: null },
    { id: 'sidebar-play-sound', type: SOUND, action: actionTypes.PLAY_SOUND, value: 'meow' },
    { id: 'sidebar-set-volume', type: SOUND, action: actionTypes.SET_VOLUME, value: 100 },
    { id: 'sidebar-change-volume-by', type: SOUND, action: actionTypes.CHANGE_VOLUME_BY, value: 10 },
    { id: 'sidebar-clear-all-sounds', type: SOUND, action: actionTypes.CLEAR_ALL_SOUNDS, value: null },
    { id: 'sidebar-when-key-pressed', type: EVENTS, action: actionTypes.WHEN_KEY_PRESSED, value: 'Space' },
    { id: 'sidebar-when-sprite-clicked', type: EVENTS, action: actionTypes.WHEN_SPRITE_CLICKED, value: null },
    { id: 'sidebar-when-backdrop-switches-to', type: EVENTS, action: actionTypes.WHEN_BACKDROP_SWITCHES_TO, value: 0 },
    { id: 'sidebar-when-loudness-greater-than', type: EVENTS, action: actionTypes.WHEN_LOUDNESS_GREATER_THAN, value: 10 },
    { id: 'sidebar-broadcast-message-for', type: EVENTS, action: actionTypes.BROADCAST_MESSAGE_FOR, value: { message: 'Hello!', duration: 2, color: '#111111' } },
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

  const executeAction = useExecuteAction(spriteRef);
  const availableBackdrops = [
    ...BACKDROPS.map((backdrop, index) => ({ ...backdrop, id: String(index) })),
    ...uploadedBackdrops,
  ];
  const selectedBackdrop = availableBackdrops.find(({ id }) => id === String(backdropValue)) || availableBackdrops[0];

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
        setBlocks((prevBlocks) => {
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
    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
    setHistory((prevHistory) => [...prevHistory, newBlock]);
  }, []);

  const moveBlock = useCallback((fromIndex, toIndex) => {
    setBlocks((prevBlocks) => {
      const nextBlocks = [...prevBlocks];
      const [movedBlock] = nextBlocks.splice(fromIndex, 1);

      if (!movedBlock) {
        return prevBlocks;
      }

      nextBlocks.splice(toIndex, 0, movedBlock);
      return nextBlocks;
    });
  }, []);

  const handleBlockChange = useCallback((id, action, value) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === id ? { ...block, value } : block
      )
    );
  }, []);

  const handleNestedBlockChange = useCallback((id, action, value) => {
    setBlocks((prevBlocks) => updateBlockValueById(prevBlocks, id, value));
  }, []);

  const handleRemoveBlock = useCallback((id) => {
    setBlocks((prevBlocks) => removeBlockById(prevBlocks, id));
  }, []);

  const handleNestedDrop = useCallback((parentId, item, branchName = 'children') => {
    if (item.id === parentId || isEventTriggerAction(item.action) || isOperatorAction(item.action)) {
      return;
    }

    setBlocks((prevBlocks) => {
      const existingBlock = item.isWorkspaceBlock ? findBlockById(prevBlocks, item.id) : null;
      const childBlock = existingBlock
        ? { ...existingBlock, id: `${Date.now()}-${Math.random()}` }
        : createWorkspaceBlock(item);

      const blocksWithoutMovedBlock = item.isWorkspaceBlock
        ? removeBlockById(prevBlocks, item.id)
        : prevBlocks;

      return appendChildBlock(blocksWithoutMovedBlock, parentId, childBlock, branchName);
    });
  }, []);

  const handleOperatorSlotChange = useCallback((id, slotName, slotValue) => {
    setBlocks((prevBlocks) => updateOperatorSlotById(prevBlocks, id, slotName, slotValue));
  }, []);

  const handleOperatorSlotDrop = useCallback((id, slotName, item) => {
    if (item.id === id || !isOperatorAction(item.action)) {
      return;
    }

    setBlocks((prevBlocks) => {
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
  }, []);

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

    setBlocks((prevBlocks) => removeVariableReporterBlocks(prevBlocks, entityType, entityName));
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

    setSpriteState((prevState) => ({
      ...prevState,
      x: nextPosition.x,
      y: nextPosition.y,
    }));
  }, [getPointerSpritePosition]);

  const handleSpritePointerUp = useCallback((event) => {
    if (!spriteDragRef.current.isDragging) return;

    spriteDragRef.current.isDragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const runBlockList = useCallback(async (blockList) => {
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
        await pause(BLOCK_STEP_DELAY_MS);
        continue;
      }

      if (block.type === CONTROLS) {
        await executeControlAction(block, runBlockList);
        await pause(BLOCK_STEP_DELAY_MS);
        continue;
      }

      await executeAction(block, sounds, soundVolume, activeAudiosRef, setSpriteState, setSpeechBubble, setSpriteColor, setBackdropValue, setSoundVolume, setBroadcastMessage);
      await pause(BLOCK_STEP_DELAY_MS);
    }
  }, [executeAction, executeControlAction, executeVariableAction, sounds, soundVolume]);

  const runMatchingEventBlocks = useCallback((predicate) => {
    blocks
      .filter((block) => isEventTriggerAction(block.action) && predicate(block))
      .forEach((block) => {
        void runBlockList(block.children || []);
      });
  }, [blocks, runBlockList]);

  const runCode = useCallback(async () => {
    if (isRunning) return;
    setSpeechBubble({ message: '', isThinking: false });
    setBroadcastMessage({ message: '', color: '#111111' });
    setIsRunning(true);

    try {
      await runBlockList(blocks);
    } finally {
      setIsRunning(false);
      setSpeechBubble({ message: '', isThinking: false });
      setBroadcastMessage({ message: '', color: '#111111' });
    }
  }, [blocks, isRunning, runBlockList]);

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

    runMatchingEventBlocks((block) => block.action === actionTypes.WHEN_SPRITE_CLICKED);
  }, [runMatchingEventBlocks]);

  const replayNthAction = useCallback((n) => {
    if (n > 0 && n <= history.length) {
      executeAction(history[n - 1], sounds, soundVolume, activeAudiosRef, setSpriteState, setSpeechBubble, setSpriteColor, setBackdropValue, setSoundVolume, setBroadcastMessage);
    }
  }, [history, executeAction, sounds, soundVolume]);

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

    const uploadedBackdrop = {
      id: `uploaded-backdrop-${Date.now()}`,
      name: file.name || 'Uploaded image',
      type: 'uploaded',
      url: URL.createObjectURL(file),
    };
    const pendingChange = pendingBackdropChangeRef.current;

    setUploadedBackdrops((prevBackdrops) => [...prevBackdrops, uploadedBackdrop]);

    if (pendingChange) {
      pendingChange.onChange(pendingChange.id, pendingChange.action, uploadedBackdrop.id);
      pendingBackdropChangeRef.current = null;
    }
  }, []);

  useEffect(() => {
    uploadedBackdropsRef.current = uploadedBackdrops;
  }, [uploadedBackdrops]);

  useEffect(() => {
    return () => {
      uploadedBackdropsRef.current.forEach((backdrop) => {
        if (backdrop.type === 'uploaded') {
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
    const hasUnsavedChanges = blocks.length > 0 || uploadedBackdrops.length > 0 || sounds.some(({ type }) => type === 'recorded');

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
  }, [blocks.length, uploadedBackdrops.length, sounds]);

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
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveSidebarTab('blocks')}
              className={`px-3 py-2 rounded text-sm font-semibold ${
                activeSidebarTab === 'blocks' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveSidebarTab('sprite')}
              className={`px-3 py-2 rounded text-sm font-semibold ${
                activeSidebarTab === 'sprite' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Sprite
            </button>
          </div>

          {activeSidebarTab === 'blocks' && (
            <>
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
            </>
          )}

          {activeSidebarTab === 'sprite' && (
            <>
              <div className="grid grid-cols-1 gap-3 mb-4">
                {DEFAULT_SPRITES.map((sprite) => (
                  <button
                    key={sprite.id}
                    type="button"
                    onClick={() => setSelectedSpriteId(sprite.id)}
                    className={`bg-white border p-2 rounded text-sm font-semibold ${
                      selectedSpriteId === sprite.id ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="w-full h-28 mb-2 bg-gray-50 border rounded flex items-center justify-center overflow-hidden">
                      <div className="w-28 h-28">
                        <CatSprite color={spriteColor} />
                      </div>
                    </div>
                    {sprite.name}
                  </button>
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
            </>
          )}
        </div>

        {/* Droppable Area */}
        <div className="w-3/6 p-4 h-[100%]">
        <h1 className="text-xl font-bold mb-4 text-center">Workspace</h1>
        <p className="text-center mb-2 font-semibold">
          Drag blocks into the center area and press "Run Code" to run your code.
        </p>
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
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={runCode}
              disabled={isRunning}
              className={`bg-green-500 text-white p-2 rounded flex items-center ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Play size={16} className="mr-1" /> Run Code
            </button>
            <button
              onClick={() => replayNthAction(prompt('Enter action number to replay:'))}
              className="bg-blue-500 text-white p-2 rounded flex items-center"
            >
              <Rewind size={16} className="mr-1" /> Replay Action
            </button>
            
          </div>
        </div>

        {/* Preview Area */}
        <div className="w-3/6 p-4 border-l">
        <h1 className="text-xl font-bold mb-4 text-center">Preview</h1>
          <div ref={previewRef} className="border p-4 h-[600px] relative min-h-[600px] overflow-x-auto overflow-y-auto" style={{
            backgroundColor: selectedBackdrop?.url ? undefined : 'white',
            backgroundImage: selectedBackdrop?.url ? `url(${selectedBackdrop.url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            {broadcastMessage.message && (
              <div
                className="absolute left-1/2 top-8 -translate-x-1/2 z-20 w-72 max-w-[80%] text-2xl font-bold text-center px-4 py-2 bg-white/80 rounded shadow whitespace-normal break-words"
                style={{ color: broadcastMessage.color }}
              >
                {broadcastMessage.message}
              </div>
            )}
            <div
              ref={spriteRef}
              className="w-24 h-24 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-grab active:cursor-grabbing select-none"
              onPointerDown={handleSpritePointerDown}
              onPointerMove={handleSpritePointerMove}
              onPointerUp={handleSpritePointerUp}
              onPointerCancel={handleSpritePointerUp}
              onClick={handleSpriteClick}
              style={{
                touchAction: 'none',
                transform: `translate(${spriteState.x}px, ${spriteState.y}px) rotate(${spriteState.rotation + 90}deg) scale(${spriteState.size / 100})`,
              }}
            >
              {speechBubble.message && (
                <SpeechBubble message={speechBubble.message} isThinking={speechBubble.isThinking} />
              )}
              <CatSprite color={spriteColor} />
            </div>
          </div>
        </div>
      </div>
      <input
        ref={backdropFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackdropUpload}
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
    </DndProvider>
  );
};

export default VisualCodeEditor;
