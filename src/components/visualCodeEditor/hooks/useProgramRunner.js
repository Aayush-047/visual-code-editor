import { useCallback, useEffect, useRef, useState } from 'react';
import * as actionTypes from '../../../constants/ActionTypes';
import { CONTROLS, OPERATORS, VARIABLES } from '../../../constants/BlockTypes';
import {
  BLOCK_STEP_DELAY_MS,
  describeBlock,
  isEventTriggerAction,
  isVariableReporterAction,
  pause,
  shouldApplyStepDelay,
  toNumber,
  toTruthiness,
} from '../config';

const useProgramRunner = ({
  activeSpriteId,
  backdropValue,
  executeAction,
  selectedReplayBlock,
  setBackdropValue,
  setHasDismissedRunNudge,
  setListValues,
  setSoundVolume,
  setSpriteSpeechBubble,
  setSprites,
  setVariableValues,
  showToast,
  soundVolume,
  sounds,
  sprites,
  updateSpriteById,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const activeAudiosRef = useRef([]);
  const runSessionRef = useRef({ id: 0, stoppedSprites: new Set() });
  const spritesRef = useRef(sprites);
  const previousBackdropValueRef = useRef(backdropValue);
  const triggerBroadcastListenersRef = useRef(() => Promise.resolve());

  const clearAllSpriteSpeechBubbles = useCallback(() => {
    setSprites((prevSprites) =>
      prevSprites.map((sprite) => ({
        ...sprite,
        speechBubble: { message: '', isThinking: false },
      }))
    );
  }, [setSprites]);

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

  const executeVariableAction = useCallback(
    async (block) => {
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
                (Number.isNaN(currentValue) ? 0 : currentValue) +
                (Number.isNaN(amount) ? 0 : amount),
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
            [listName]: (prevValues[listName] || []).filter(
              (_, itemIndex) => itemIndex !== index
            ),
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
    },
    [setListValues, setVariableValues]
  );

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

        if (isEventTriggerAction(block.action) || block.type === OPERATORS) {
          continue;
        }

        if (block.type === VARIABLES) {
          if (isVariableReporterAction(block.action)) {
            continue;
          }
          await executeVariableAction(block);
          if (shouldApplyStepDelay(block) && !(await waitForMs(BLOCK_STEP_DELAY_MS))) {
            return;
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
          if (shouldApplyStepDelay(block) && !(await waitForMs(BLOCK_STEP_DELAY_MS))) {
            return;
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
        if (shouldApplyStepDelay(block) && !(await waitForMs(BLOCK_STEP_DELAY_MS))) {
          return;
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
      setSoundVolume,
      setSpriteSpeechBubble,
      soundVolume,
      sounds,
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

  const handleSelectedSpriteClick = useCallback(() => {
    runMatchingEventBlocks(
      (block) => block.action === actionTypes.WHEN_SPRITE_CLICKED,
      (sprite) => sprite.id === activeSpriteId
    );
  }, [activeSpriteId, runMatchingEventBlocks]);

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
  }, [
    clearAllSpriteSpeechBubbles,
    isRunning,
    runBlockListForSprite,
    setHasDismissedRunNudge,
    showToast,
    sprites,
  ]);

  const replaySelectedBlock = useCallback(
    async (blockOverride = null) => {
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
    },
    [activeSpriteId, runBlockListForSprite, selectedReplayBlock, showToast]
  );

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

  useEffect(() => {
    spritesRef.current = sprites;
  }, [sprites]);

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

  useEffect(
    () => () => {
      stopAllActiveSounds();
    },
    [stopAllActiveSounds]
  );

  return {
    handleSelectedSpriteClick,
    isRunning,
    replaySelectedBlock,
    runCode,
    stopAllCode,
    stopCurrentSprite,
  };
};

export default useProgramRunner;
