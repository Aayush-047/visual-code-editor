import { OPERATORS } from '../../../constants/BlockTypes';
import {
  ADD_TO_LIST,
  CHANGE_VARIABLE_BY,
  CHANGE_VOLUME_BY,
  CLEAR_ALL_SOUNDS,
  DELETE_ALL_OF_LIST,
  DELETE_FROM_LIST,
  IF_THEN,
  IF_THEN_ELSE,
  INSERT_AT_LIST,
  OPERATOR_ADD,
  OPERATOR_AND,
  OPERATOR_CONTAINS,
  OPERATOR_DIVIDE,
  OPERATOR_EQUALS,
  OPERATOR_GREATER_THAN,
  OPERATOR_JOIN,
  OPERATOR_LENGTH_OF,
  OPERATOR_LESS_THAN,
  OPERATOR_LETTER_OF,
  OPERATOR_MATH_FUNCTION,
  OPERATOR_MODULO,
  OPERATOR_MULTIPLY,
  OPERATOR_NOT,
  OPERATOR_OR,
  OPERATOR_PICK_RANDOM,
  OPERATOR_SUBTRACT,
  PLAY_SOUND,
  REPEAT_TIMES,
  REPEAT_UNTIL,
  REPLACE_ITEM_IN_LIST,
  SET_VARIABLE_TO,
  SET_VOLUME,
  VARIABLE_REPORTER,
  LIST_REPORTER,
  WHEN_BACKDROP_SWITCHES_TO,
  WHEN_I_RECEIVE,
  WHEN_KEY_PRESSED,
  WHEN_LOUDNESS_GREATER_THAN,
  WHEN_SPRITE_CLICKED,
  FOREVER,
} from '../../../constants/ActionTypes';

export const KEY_OPTIONS = [
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

export const RECORD_SOUND_OPTION = '__record_sound__';
export const UPLOAD_BACKDROP_OPTION = '__upload_backdrop__';

export const EVENT_TRIGGER_ACTIONS = [
  WHEN_KEY_PRESSED,
  WHEN_SPRITE_CLICKED,
  WHEN_BACKDROP_SWITCHES_TO,
  WHEN_LOUDNESS_GREATER_THAN,
  WHEN_I_RECEIVE,
];

export const CONTROL_CONTAINER_ACTIONS = [
  REPEAT_TIMES,
  FOREVER,
  IF_THEN,
  IF_THEN_ELSE,
  REPEAT_UNTIL,
];

export const OPERATOR_ACTIONS = [
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

export const OPERATOR_NUMBER_MIN = -1000000;
export const OPERATOR_NUMBER_MAX = 1000000;
export const MATH_FUNCTION_OPTIONS = [
  'abs',
  'floor',
  'ceiling',
  'sqrt',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'ln',
  'log',
  'e^',
  '10^',
];
export const DROPDOWN_MENU_MAX_HEIGHT = 176;
export const INPUT_BASE_CLASSNAME =
  'themed-input-pill block-input rounded-full border border-transparent px-2 py-1 font-medium text-black outline-none transition';
export const WORKSPACE_INPUT_CLASSNAME = 'focus:border-blue-500 focus:ring-2 focus:ring-blue-200';
export const PALETTE_INPUT_CLASSNAME = 'focus:border-slate-300';
export const DROPDOWN_PILL_CLASSNAME =
  'dropdown-pill flex items-center justify-between gap-2 rounded-full bg-white px-2 text-black shadow-sm';

export const EVENT_TOOLTIPS = {
  [WHEN_KEY_PRESSED]: 'Runs when you press this keyboard key',
  [WHEN_SPRITE_CLICKED]: 'Runs when you click the sprite in the preview',
  [WHEN_BACKDROP_SWITCHES_TO]: 'Runs when the stage changes to this backdrop',
  [WHEN_LOUDNESS_GREATER_THAN]: 'Runs when your microphone hears a loud sound',
  [WHEN_I_RECEIVE]: 'Runs when another block broadcasts this message',
};

export const SOUND_ICONS = {
  [PLAY_SOUND]: '♪',
  [SET_VOLUME]: '▤',
  [CHANGE_VOLUME_BY]: '±',
  [CLEAR_ALL_SOUNDS]: '✕',
};

export const isOperatorBlockValue = (slotValue) =>
  slotValue && typeof slotValue === 'object' && slotValue.type === OPERATORS;

export const getOperatorInputWidth = (slotValue, compact, minCharsOverride) => {
  const minChars = minCharsOverride ?? (compact ? 7 : 8);
  const maxChars = compact ? 12 : 16;
  const nextChars = String(slotValue ?? '').length || minChars;
  return `${Math.min(maxChars, Math.max(minChars, nextChars + 1))}ch`;
};

export const isEventTriggerBlockAction = (action) => EVENT_TRIGGER_ACTIONS.includes(action);
export const isControlContainerBlockAction = (action) => CONTROL_CONTAINER_ACTIONS.includes(action);
export const isOperatorBlockAction = (action) => OPERATOR_ACTIONS.includes(action);

export const isVariableActionWithObjectValue = (action) =>
  [
    SET_VARIABLE_TO,
    CHANGE_VARIABLE_BY,
    ADD_TO_LIST,
    DELETE_FROM_LIST,
    DELETE_ALL_OF_LIST,
    INSERT_AT_LIST,
    REPLACE_ITEM_IN_LIST,
  ].includes(action);

export const isVariableReporterActionType = (action) =>
  action === VARIABLE_REPORTER || action === LIST_REPORTER;
